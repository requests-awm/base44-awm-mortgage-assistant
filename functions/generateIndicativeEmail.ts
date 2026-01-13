import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Default template function
function getDefaultTemplate(caseData) {
  const firstName = caseData.client_name.split(' ')[0];
  const lenderCount = (caseData.matched_lenders || []).length;
  const categoryLabel = {
    residential: 'Residential',
    buy_to_let: 'Buy-to-Let',
    later_life: 'Later Life',
    ltd_company: 'Ltd Company'
  }[caseData.category] || caseData.category;
  
  const purposeLabel = {
    purchase: 'purchase',
    remortgage: 'remortgage',
    rate_expiry: 'rate switch'
  }[caseData.purpose] || caseData.purpose;
  
  return {
    subject: 'Your Mortgage Options - Initial Assessment',
    body: `Hi ${firstName},

Thank you for considering Ascot Wealth Management for your mortgage needs.

Based on the information provided:
- Property value: £${caseData.property_value?.toLocaleString() || 'N/A'}
- Loan amount: £${caseData.loan_amount?.toLocaleString() || 'N/A'}
- Loan-to-value: ${caseData.ltv || 'N/A'}%
- ${categoryLabel} mortgage for ${purposeLabel}

We've identified ${lenderCount} lenders that match your specific circumstances and criteria.

We'd be pleased to proceed with a comprehensive professional quote to find you the most suitable option based on your financial situation. Our team will:
- Compare rates and terms across your matched lenders
- Identify the best product for your needs
- Handle the application process on your behalf

If you'd like us to proceed, simply reply to this email or call us at [phone].

Best regards,
[Adviser Name]
Ascot Wealth Management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Important Information:
This assessment is indicative only and does not constitute regulated financial advice. A full analysis and formal recommendation will be provided following our comprehensive review process.

Our professional service fee is £750. This fee becomes payable if you proceed with our service and subsequently withdraw after we have commenced work on your application. By proceeding, you acknowledge and accept these terms.

Ascot Wealth Management is authorised and regulated by the Financial Conduct Authority (FCA).`
  };
}

// Locked template sections (never AI-generated)
const LOCKED_SECTIONS = {
  disclaimer: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Important Information:
This assessment is indicative only and does not constitute regulated financial advice. A full analysis and formal recommendation will be provided following our comprehensive review process.

Our professional service fee is £750. This fee becomes payable if you proceed with our service and subsequently withdraw after we have commenced work on your application. By proceeding, you acknowledge and accept these terms.

Ascot Wealth Management is authorised and regulated by the Financial Conduct Authority (FCA).`,
  
  signOff: `Best regards,
[Adviser Name]
Ascot Wealth Management`
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('[EMAIL_GEN] Unauthorized - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await req.json();
    const { case_id, adjustment, use_default } = requestData;
    console.log('[EMAIL_GEN] Starting generation for case:', case_id, 'adjustment:', adjustment, 'use_default:', use_default);

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

    // If use_default is true, return default template immediately
    if (use_default) {
      console.log('[EMAIL_GEN] Using default template');
      const defaultTemplate = getDefaultTemplate(mortgageCase);
      
      const currentVersion = mortgageCase.email_version || 0;
      await base44.entities.MortgageCase.update(case_id, {
        email_draft: defaultTemplate.body,
        email_subject: defaultTemplate.subject,
        email_generated_at: new Date().toISOString(),
        email_status: 'draft',
        email_version: currentVersion + 1,
        last_activity_by: user.full_name || user.email
      });

      await base44.entities.AuditLog.create({
        case_id: case_id,
        action: `Email draft generated using default template (v${currentVersion + 1})`,
        action_category: 'delivery',
        actor: 'user',
        actor_email: user.email,
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        draft: defaultTemplate.body,
        subject: defaultTemplate.subject,
        version: currentVersion + 1,
        used_default: true
      });
    }

    // Extract client first name
    const clientFirstName = mortgageCase.client_name?.split(' ')[0] || 'there';
    
    // Get matched lender count
    const lenderCount = (mortgageCase.matched_lenders || []).length;
    
    // Category and purpose labels
    const categoryLabel = {
      residential: 'Residential',
      buy_to_let: 'Buy-to-Let',
      later_life: 'Later Life',
      ltd_company: 'Ltd Company'
    }[mortgageCase.category] || mortgageCase.category;
    
    const purposeLabel = {
      purchase: 'purchase',
      remortgage: 'remortgage',
      rate_expiry: 'rate switch'
    }[mortgageCase.purpose] || mortgageCase.purpose;

    // Build email context
    let mortgageContext = '';
    if (mortgageCase.purpose === 'remortgage' && mortgageCase.existing_lender) {
      mortgageContext = `\n\nCURRENT MORTGAGE: ${mortgageCase.existing_lender} at ${mortgageCase.existing_rate}% (expires ${mortgageCase.existing_product_end_date || 'N/A'})`;
    }

    // Build prompt based on adjustment type
    let toneInstruction = 'professional and consultative';
    let focusInstruction = '';
    
    if (adjustment === 'formal') {
      toneInstruction = 'highly professional and corporate, using formal language';
    } else if (adjustment === 'friendly') {
      toneInstruction = 'warm and conversational, more personal';
    } else if (adjustment === 'urgent') {
      toneInstruction = 'professional with emphasis on urgency and timeline';
      if (mortgageCase.existing_product_end_date) {
        focusInstruction = `EMPHASIZE: Their current deal expires on ${mortgageCase.existing_product_end_date}. Stress the importance of acting soon.`;
      }
    }

    // Build AI prompt - generates main body only (no greeting)
    const prompt = `Write the main body sections for a UK mortgage client email (${toneInstruction} tone).

CLIENT DETAILS:
Property: £${mortgageCase.property_value?.toLocaleString() || 'N/A'}
Loan: £${mortgageCase.loan_amount?.toLocaleString() || 'N/A'}
LTV: ${mortgageCase.ltv || 'N/A'}%
Category: ${categoryLabel}
Purpose: ${purposeLabel}
Matched Lenders: ${lenderCount}${mortgageContext}

${focusInstruction}

DO NOT INCLUDE:
- Greeting (no "Hi" or "Dear")
- Specific lender names
- Rate estimates or percentages
- Mentions of shopping around
- Closing signature

DO INCLUDE:
- Number of matched lenders
- Personalized summary of their situation
- What we'll do next (compare rates, identify best product, handle application)
- Clear call to action (reply or call)

Generate 3 sections (120-150 words total):

1. INTRO: Thank them and summarize their situation (property value, loan, LTV, category/purpose)
2. MATCHES: State number of matched lenders and what we'll do (compare, identify best, handle process)
3. CTA: Simple call to action to reply or call

Format your response EXACTLY like this:
INTRO: [your text here]
MATCHES: [your text here]
CTA: [your text here]

UK spelling. Professional but approachable tone.`;

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[EMAIL_GEN] OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('[EMAIL_GEN] Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a UK mortgage adviser assistant. Write professional emails. Follow formatting instructions precisely.'
        }, {
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[EMAIL_GEN] OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('[EMAIL_GEN] OpenAI response received');
    const aiOutput = openaiData.choices?.[0]?.message?.content;

    if (!aiOutput) {
      console.error('[EMAIL_GEN] No content in OpenAI response');
      throw new Error('No email content generated');
    }

    console.log('[EMAIL_GEN] AI output length:', aiOutput.length);

    // Parse AI-generated sections
    const sections = {};
    const introMatch = aiOutput.match(/INTRO:\s*(.+?)(?=\nMATCHES:|$)/s);
    const matchesMatch = aiOutput.match(/MATCHES:\s*(.+?)(?=\nCTA:|$)/s);
    const ctaMatch = aiOutput.match(/CTA:\s*(.+?)(?=\n|$)/s);
    
    sections.intro = introMatch ? introMatch[1].trim() : `Thank you for considering Ascot Wealth Management for your mortgage needs.\n\nBased on the information provided:\n- Property value: £${mortgageCase.property_value?.toLocaleString() || 'N/A'}\n- Loan amount: £${mortgageCase.loan_amount?.toLocaleString() || 'N/A'}\n- Loan-to-value: ${mortgageCase.ltv || 'N/A'}%\n- ${categoryLabel} mortgage for ${purposeLabel}`;
    sections.matches = matchesMatch ? matchesMatch[1].trim() : `We've identified ${lenderCount} lenders that match your specific circumstances and criteria.\n\nWe'd be pleased to proceed with a comprehensive professional quote to find you the most suitable option based on your financial situation. Our team will:\n- Compare rates and terms across your matched lenders\n- Identify the best product for your needs\n- Handle the application process on your behalf`;
    sections.cta = ctaMatch ? ctaMatch[1].trim() : "If you'd like us to proceed, simply reply to this email or call us at [phone].";

    const emailSubject = 'Your Mortgage Options - Initial Assessment';
    
    // Assemble full email with template structure
    const emailBody = `Hi ${clientFirstName},

${sections.intro}

${sections.matches}

${sections.cta}

${LOCKED_SECTIONS.signOff}

${LOCKED_SECTIONS.disclaimer}`.trim();

    // Update case with email draft
    const currentVersion = mortgageCase.email_version || 0;
    console.log('[EMAIL_GEN] Updating case with draft, version:', currentVersion + 1);
    await base44.entities.MortgageCase.update(case_id, {
      email_draft: emailBody,
      email_subject: emailSubject,
      email_generated_at: new Date().toISOString(),
      email_version: currentVersion + 1,
      email_status: 'draft',
      last_activity_by: user.full_name || user.email
    });
    console.log('[EMAIL_GEN] Case updated successfully');

    // Log to audit
    const apiResponseTime = Date.now() - startTime;
    await base44.entities.AuditLog.create({
      case_id: case_id,
      action: `Email draft generated${adjustment ? ` (${adjustment})` : ''} (v${currentVersion + 1})`,
      action_category: 'delivery',
      actor: 'user',
      actor_email: user.email,
      details: {
        api_response_time_ms: apiResponseTime,
        word_count: emailBody.split(/\s+/).length,
        version: currentVersion + 1,
        adjustment: adjustment || 'none'
      },
      timestamp: new Date().toISOString()
    });

    console.log('[EMAIL_GEN] Success! Returning response');
    return Response.json({
      success: true,
      draft: emailBody,
      subject: emailSubject,
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