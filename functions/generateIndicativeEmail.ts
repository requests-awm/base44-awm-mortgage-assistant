import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Default template function
function getDefaultTemplate(caseData) {
  const firstName = caseData.client_name.split(' ')[0];
  const lenderList = (caseData.matched_lenders || []).slice(0, 5).map(l => l.name).join(', ');
  
  return {
    subject: `Your ${caseData.purpose === 'remortgage' ? 'Remortgage' : 'Mortgage'} Options - Initial Assessment`,
    body: `Hi ${firstName},

I hope this message finds you well. I wanted to provide you with an initial assessment of your ${caseData.purpose === 'remortgage' ? 'remortgage' : 'mortgage'} enquiry based on the information you've provided.

Given your property value of £${caseData.property_value?.toLocaleString()} and loan amount of £${caseData.loan_amount?.toLocaleString()} (${caseData.ltv}% LTV), I can provide an indicative interest rate range of approximately 4.5% to 5.5%. Please note this is indicative only and subject to full assessment.

Based on our initial review, the following lenders may be suitable: ${lenderList}. These options are pending a comprehensive review of your financial circumstances and the lenders' final criteria.

Please note: Should you decide to proceed and we submit your application, there is a £750 non-refundable processing fee. This fee covers our professional advisory services, lender liaison, and application management. It is important to note that this fee applies even if you later decide not to proceed with the mortgage.

Please remember, this is an indicative assessment only and does not constitute regulated mortgage advice. A full fact-find and affordability assessment will be required before any formal recommendation can be made.

I'd be delighted to discuss your options in more detail. Please reply to this email or book a call at your convenience.

Warm regards,
[Adviser Name]
[Position]
[Contact Info]
[Company Name]`
  };
}

// Locked template sections (never AI-generated)
const LOCKED_SECTIONS = {
  feeDisclosure: `Please note: Should you decide to proceed and we submit your application, there is a £750 non-refundable processing fee. This fee covers our professional advisory services, lender liaison, and application management. It is important to note that this fee applies even if you later decide not to proceed with the mortgage.`,
  
  fcaDisclaimer: `Please remember, this is an indicative assessment only and does not constitute regulated mortgage advice. A full fact-find and affordability assessment will be required before any formal recommendation can be made.`,
  
  signOff: `If you have any questions or would like to discuss this further, please feel free to reply to this email or book a call with me at your convenience. I'm here to help you navigate this process smoothly.

Warm regards,
[Adviser Name]
[Position]
[Contact Info]
[Company Name]`
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
        email_version: currentVersion + 1
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

    // Build prompt based on adjustment type
    let toneInstruction = 'professional but friendly';
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
    } else if (adjustment === 'savings') {
      if (mortgageCase.existing_rate) {
        focusInstruction = `FOCUS: Compare their current ${mortgageCase.existing_rate}% rate to potential new rates. Highlight savings opportunity.`;
      }
    } else if (adjustment === 'speed') {
      focusInstruction = 'FOCUS: Emphasize fast turnaround, quick lender decisions, and efficient processing.';
    } else if (adjustment === 'experience') {
      focusInstruction = 'FOCUS: Highlight adviser expertise, successful track record, and professional credentials.';
    }

    // Build AI prompt (generates only specific sections)
    const prompt = `Write ONLY the following 4 sections for a UK mortgage client email (${toneInstruction} tone):

CLIENT: ${clientFirstName} ${mortgageCase.client_name}
PROPERTY: £${mortgageCase.property_value?.toLocaleString() || 'N/A'} | LOAN: £${mortgageCase.loan_amount?.toLocaleString() || 'N/A'} | LTV: ${mortgageCase.ltv || 'N/A'}%
CATEGORY: ${mortgageCase.category || 'N/A'} | PURPOSE: ${mortgageCase.purpose || 'N/A'}
INCOME: £${mortgageCase.annual_income?.toLocaleString() || 'N/A'}${mortgageContext}
MATCHED LENDERS: ${matchedLenderNames || 'To be determined'}

${focusInstruction}

Generate ONLY these 4 sections (150-200 words total):

1. OPENING: 2-3 sentences summarizing their specific situation (use first name)
2. RATE_GUIDANCE: Indicative rate range 4.5%-5.5% with brief context
3. LENDERS: Brief mention of matched lenders as potential options (not guarantees, pending full assessment)
4. CTA: One sentence inviting them to discuss further

Format your response EXACTLY like this:
OPENING: [your text here]
RATE_GUIDANCE: [your text here]
LENDERS: [your text here]
CTA: [your text here]

Also provide a subject line.
UK spelling throughout. Be concise.`;

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
    const openingMatch = aiOutput.match(/OPENING:\s*(.+?)(?=\nRATE_GUIDANCE:|$)/s);
    const rateMatch = aiOutput.match(/RATE_GUIDANCE:\s*(.+?)(?=\nLENDERS:|$)/s);
    const lendersMatch = aiOutput.match(/LENDERS:\s*(.+?)(?=\nCTA:|$)/s);
    const ctaMatch = aiOutput.match(/CTA:\s*(.+?)(?=\n|$)/s);
    
    sections.opening = openingMatch ? openingMatch[1].trim() : `I hope this message finds you well. I wanted to provide you with an initial assessment of your ${mortgageCase.purpose} enquiry.`;
    sections.rateGuidance = rateMatch ? rateMatch[1].trim() : 'Based on your circumstances, the indicative interest rate range is approximately 4.5% to 5.5%. Please note this is subject to full assessment.';
    sections.lenders = lendersMatch ? lendersMatch[1].trim() : `The following lenders may be suitable: ${matchedLenderNames}. These are indicative options pending comprehensive review.`;
    sections.cta = ctaMatch ? ctaMatch[1].trim() : "I'd be delighted to discuss your options in more detail.";

    // Extract subject line
    const subjectMatch = aiOutput.match(/Subject:\s*(.+?)(\n|$)/i);
    const emailSubject = subjectMatch ? subjectMatch[1].trim() : 
      (mortgageCase.purpose === 'remortgage' ? 'Your Remortgage Options - Initial Assessment' : 'Your Mortgage Options - Initial Assessment');
    
    // Assemble full email with locked sections
    const emailBody = `Hi ${clientFirstName},

${sections.opening}

${sections.rateGuidance}

${sections.lenders}

${LOCKED_SECTIONS.feeDisclosure}

${LOCKED_SECTIONS.fcaDisclaimer}

${sections.cta}

${LOCKED_SECTIONS.signOff}`.trim();

    // Update case with email draft
    const currentVersion = mortgageCase.email_version || 0;
    console.log('[EMAIL_GEN] Updating case with draft, version:', currentVersion + 1);
    await base44.entities.MortgageCase.update(case_id, {
      email_draft: emailBody,
      email_subject: emailSubject,
      email_generated_at: new Date().toISOString(),
      email_version: currentVersion + 1,
      email_status: 'draft'
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