/**
 * Seed EmailSettings Entity
 *
 * Purpose: Populate default email configuration settings
 * Includes configurable batch send time for admin flexibility
 *
 * Usage: Run once during Phase 3-01 schema setup
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    console.log('[SEED] Starting EmailSettings seed...');

    // Check if settings already exist
    const existing = await base44.asServiceRole.entities.EmailSettings.list();

    if (existing && existing.length > 0) {
      console.log('[SEED] EmailSettings already exist, skipping seed');
      return Response.json({
        success: true,
        message: 'EmailSettings already exist',
        settings: existing[0]
      });
    }

    // Create default settings using asServiceRole
    const settings = await base44.asServiceRole.entities.EmailSettings.create({
      batch_send_time: '16:00', // 4 PM UK time (default)
      batch_send_timezone: 'Europe/London',
      batch_send_enabled: true,
      instant_send_enabled: true,
      sender_email: 'requests@ascotwm.com',
      max_batch_size: 50,
      retry_failed_sends: true,
      retry_max_attempts: 3,
      updated_at: new Date().toISOString()
    });

    console.log('[SEED] EmailSettings created:', settings);

    return Response.json({
      success: true,
      message: 'EmailSettings seeded successfully',
      settings
    });

  } catch (error) {
    console.error('[SEED] EmailSettings seed failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});