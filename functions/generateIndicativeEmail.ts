import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('[EMAIL_GEN] Unauthorized - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();
    console.log('[EMAIL_GEN] Starting generation for case:', case_id);

    if (!case_id) {
      console.error('[EMAIL_GEN] No case_id provided');
      return Response.json({ error: 'case_id is required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Fetch case data
    console.log('[EMAIL_GEN] Fetching case data...');
    const cases = await base44.entities.MortgageCase.filter({ id: case_id });
    const mortgageCase = cases[0];

    if (!mortgageCase) {
      console.error('[EMAIL_GEN] Case not found:', case_id);
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    console.log('[EMAIL_GEN] Case found:', mortgageCase.client_name, 'LTV:', mortgageCase.ltv);

    // Extract client first name
    const clientFirstName = mortgageCase.client_name?.split(' ')[0] || 'there';
    
    // Get matched lender names (max 5)
    const matchedLenderNames = (mortgageCase.matched_lenders || [])
      .slice(0, 5)
      .map(l => l.name)
      .join(', ');

    // Build email context
    let mortgageContext = '';
    if (mortgageCase.purpose === 'remortgage' && mortgageCase.existing_lender) {
      mortgageContext = `\n\nCURRENT MORTGAGE: ${mortgageCase.existing_lender} at ${mortgageCase.existing_rate}% (expires ${mortgageCase.existing_product_end_date || 'N/A'})`;
    }

    const triageLabel = mortgageCase.triage_rating || 'Standard';
    const triageDescription = mortgageCase.triage_factors?.join(', ') || 'Standard case';

    // Build Gemini API prompt
    const prompt = `You are a UK mortgage adviser assistant. Generate a professional yet warm email for indicative mortgage assessment.

CLIENT: ${clientFirstName} ${mortgageCase.client_name}
PROPERTY: £${mortgageCase.property_value?.toLocaleString() || 'N/A'} | LOAN: £${mortgageCase.loan_amount?.toLocaleString() || 'N/A'} | LTV: ${mortgageCase.ltv || 'N/A'}%
CATEGORY: ${mortgageCase.category || 'N/A'} | PURPOSE: ${mortgageCase.purpose || 'N/A'}
INCOME: £${mortgageCase.annual_income?.toLocaleString() || 'N/A'} (${mortgageCase.income_type || 'N/A'})${mortgageContext}

MATCHED LENDERS (${(mortgageCase.matched_lenders || []).length}): ${matchedLenderNames || 'To be determined'}
ASSESSMENT: ${triageLabel} - ${triageDescription}

WRITE EMAIL:
- Greeting: Use first name only, warm and friendly
- Summary: 2-3 sentences about their situation
- Rate guidance: Indicative range 4.5%-5.5%
- Lenders: Mention these are likely options pending full assessment
- FEE DISCLOSURE (CRITICAL): 'Please note: Should you decide to proceed and we submit your application, there is a £750 non-refundable processing fee. This covers our professional advisory services, lender liaison, and application management. The fee applies even if you later decide not to proceed with the mortgage.'
- Disclaimer: 'This is an indicative assessment only and does not constitute regulated mortgage advice. A full fact-find and affordability assessment will be required before any formal recommendation.'
- Call to action: Invite to book call or reply with questions
- Sign off: Warm and professional
- Length: 250-350 words maximum
- UK spelling throughout

Output only the email body - no preamble or explanations.`;

    // Call Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('[EMAIL_GEN] GEMINI_API_KEY not configured');
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('[EMAIL_GEN] Calling OpenAI API as fallback...');
    // Use OpenAI's ChatGPT instead since Gemini quota is exhausted
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'You are a UK mortgage adviser assistant. Write professional emails.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[EMAIL_GEN] OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[EMAIL_GEN] OpenAI response received');
    const emailDraft = openaiData.choices?.[0]?.message?.content;

    if (!emailDraft) {
      console.error('[EMAIL_GEN] No content in OpenAI response:', JSON.stringify(openaiData));
      throw new Error('No email content generated');
    }

    console.log('[EMAIL_GEN] Email generated, length:', emailDraft.length);



    // Generate subject based on purpose
    let subject = 'Your Mortgage Assessment';
    if (mortgageCase.purpose === 'remortgage') {
      subject = 'Your Remortgage Options - Initial Assessment';
    } else if (mortgageCase.purpose === 'purchase') {
      subject = 'Your Mortgage Options - Initial Assessment';
    }

    // Update case with email draft
    const currentVersion = mortgageCase.email_version || 0;
    console.log('[EMAIL_GEN] Updating case with draft, version:', currentVersion + 1);
    await base44.entities.MortgageCase.update(case_id, {
      email_draft: emailDraft,
      email_subject: subject,
      email_generated_at: new Date().toISOString(),
      email_version: currentVersion + 1,
      email_status: 'draft'
    });
    console.log('[EMAIL_GEN] Case updated successfully');

    // Log to audit
    const apiResponseTime = Date.now() - startTime;
    await base44.entities.AuditLog.create({
      case_id: case_id,
      action: `Email draft generated (v${currentVersion + 1})`,
      action_category: 'delivery',
      actor: 'user',
      actor_email: user.email,
      details: {
        api_response_time_ms: apiResponseTime,
        word_count: emailDraft.split(/\s+/).length,
        version: currentVersion + 1
      },
      timestamp: new Date().toISOString()
    });

    console.log('[EMAIL_GEN] Success! Returning response');
    return Response.json({
      success: true,
      draft: emailDraft,
      subject: subject,
      version: currentVersion + 1,
      api_response_time_ms: apiResponseTime
    });

  } catch (error) {
    console.error('[EMAIL_GEN] Error:', error.message);

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});