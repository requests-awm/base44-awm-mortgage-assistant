/**
 * Update Email Settings
 *
 * Purpose: Allow admin to update email configuration
 * Includes batch send time, timezone, and other settings
 *
 * Usage: Called from admin UI or directly
 *
 * @param settings - Object with settings to update
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      batch_send_time,
      batch_send_timezone,
      batch_send_enabled,
      instant_send_enabled,
      sender_email,
      max_batch_size,
      retry_failed_sends,
      retry_max_attempts
    } = await req.json();

    console.log('[SETTINGS] Updating email settings...');

    // Get current settings
    const settingsResults = await base44.entities.EmailSettings.filter({});
    let settings = settingsResults && settingsResults.length > 0 ? settingsResults[0] : null;

    if (!settings) {
      // Create settings if they don't exist
      console.log('[SETTINGS] No existing settings, creating new...');
      settings = await base44.entities.EmailSettings.create({
        batch_send_time: batch_send_time || '16:00',
        batch_send_timezone: batch_send_timezone || 'Europe/London',
        batch_send_enabled: batch_send_enabled !== undefined ? batch_send_enabled : true,
        instant_send_enabled: instant_send_enabled !== undefined ? instant_send_enabled : true,
        sender_email: sender_email || 'requests@ascotwm.com',
        max_batch_size: max_batch_size || 50,
        retry_failed_sends: retry_failed_sends !== undefined ? retry_failed_sends : true,
        retry_max_attempts: retry_max_attempts || 3,
        updated_at: new Date().toISOString()
      });

      console.log('[SETTINGS] Settings created');
    } else {
      // Update existing settings
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (batch_send_time !== undefined) updateData.batch_send_time = batch_send_time;
      if (batch_send_timezone !== undefined) updateData.batch_send_timezone = batch_send_timezone;
      if (batch_send_enabled !== undefined) updateData.batch_send_enabled = batch_send_enabled;
      if (instant_send_enabled !== undefined) updateData.instant_send_enabled = instant_send_enabled;
      if (sender_email !== undefined) updateData.sender_email = sender_email;
      if (max_batch_size !== undefined) updateData.max_batch_size = max_batch_size;
      if (retry_failed_sends !== undefined) updateData.retry_failed_sends = retry_failed_sends;
      if (retry_max_attempts !== undefined) updateData.retry_max_attempts = retry_max_attempts;

      await base44.entities.EmailSettings.update(settings.id, updateData);

      console.log('[SETTINGS] Settings updated');
    }

    // Get updated settings
    const updatedResults = await base44.entities.EmailSettings.filter({});
    const updated = updatedResults && updatedResults.length > 0 ? updatedResults[0] : null;

    // Create audit log
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      action: 'Email settings updated',
      action_category: 'configuration',
      actor: 'user',
      actor_email: user.email,
      timestamp: new Date().toISOString(),
      metadata: {
        batch_send_time: updated.batch_send_time,
        batch_send_timezone: updated.batch_send_timezone,
        updated_by: user.email
      }
    });

    return Response.json({
      success: true,
      message: 'Email settings updated successfully',
      settings: {
        batch_send_time: updated.batch_send_time,
        batch_send_timezone: updated.batch_send_timezone,
        batch_send_enabled: updated.batch_send_enabled,
        instant_send_enabled: updated.instant_send_enabled,
        sender_email: updated.sender_email,
        max_batch_size: updated.max_batch_size,
        retry_failed_sends: updated.retry_failed_sends,
        retry_max_attempts: updated.retry_max_attempts,
        updated_at: updated.updated_at
      }
    });

  } catch (error) {
    console.error('[SETTINGS] Failed to update settings:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
