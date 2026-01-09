import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { case_id } = await req.json();

    if (!case_id) {
      return Response.json({ error: 'case_id is required' }, { status: 400 });
    }

    const startTime = Date.now();

    // Fetch case data
    const cases = await base44.entities.MortgageCase.filter({ id: case_id });
    const mortgageCase = cases[0];

    if (!mortgageCase) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

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
      throw new Error('GEMINI_API_KEY not configured');
    }

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const emailDraft = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!emailDraft) {
      throw new Error('No email content generated');
    }

    // Generate subject based on purpose
    let subject = 'Your Mortgage Assessment';
    if (mortgageCase.purpose === 'remortgage') {
      subject = 'Your Remortgage Options - Initial Assessment';
    } else if (mortgageCase.purpose === 'purchase') {
      subject = 'Your Mortgage Options - Initial Assessment';
    }

    // Update case with email draft
    const currentVersion = mortgageCase.email_version || 0;
    await base44.entities.MortgageCase.update(case_id, {
      email_draft: emailDraft,
      email_subject: subject,
      email_generated_at: new Date().toISOString(),
      email_version: currentVersion + 1,
      email_status: 'draft'
    });

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

    return Response.json({
      success: true,
      draft: emailDraft,
      subject: subject,
      version: currentVersion + 1,
      api_response_time_ms: apiResponseTime
    });

  } catch (error) {
    console.error('Email generation error:', error);

    // Try to update case status to failed
    try {
      const { case_id } = await req.json();
      if (case_id) {
        const base44 = createClientFromRequest(req);
        await base44.entities.MortgageCase.update(case_id, {
          email_status: 'failed'
        });
      }
    } catch (updateError) {
      console.error('Failed to update case status:', updateError);
    }

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});