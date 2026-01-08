import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_deadline } = await req.json();

    // No deadline = standard
    if (!client_deadline) {
      return Response.json({
        urgency: 'standard',
        color: '#9CA3AF',
        label: 'Standard',
        days_left: null
      });
    }

    const now = new Date();
    const deadline = new Date(client_deadline);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil((deadline - now) / msPerDay);

    let urgency, color, label;

    if (daysLeft < 0) {
      urgency = 'overdue';
      color = '#DC2626';
      label = 'Overdue';
    } else if (daysLeft <= 7) {
      urgency = 'critical';
      color = '#EF4444';
      label = 'Critical';
    } else if (daysLeft <= 30) {
      urgency = 'soon';
      color = '#F59E0B';
      label = 'Soon';
    } else {
      urgency = 'standard';
      color = '#9CA3AF';
      label = 'Standard';
    }

    return Response.json({
      urgency,
      color,
      label,
      days_left: daysLeft
    });

  } catch (error) {
    console.error('Timeline urgency calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});