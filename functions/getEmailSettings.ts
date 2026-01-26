/**
 * Get Email Settings
 *
 * Purpose: Retrieve current email configuration settings
 * Used by Zapier to get batch send time and other config
 *
 * Returns: Current email settings including batch_send_time
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log('[SETTINGS] Fetching email settings...');

    // Get settings (should only be one record)
    const settingsResults = await base44.entities.EmailSettings.filter({});
    const settings = settingsResults && settingsResults.length > 0 ? settingsResults[0] : null;

    if (!settings) {
      console.log('[SETTINGS] No settings found, returning defaults');

      // Return defaults if not seeded yet
      return Response.json({
        success: true,
        settings: {
          batch_send_time: '16:00',
          batch_send_timezone: 'Europe/London',
          batch_send_enabled: true,
          instant_send_enabled: true,
          sender_email: 'requests@ascotwm.com',
          max_batch_size: 50
        }
      });
    }

    console.log('[SETTINGS] Found settings:', settings);

    return Response.json({
      success: true,
      settings: {
        batch_send_time: settings.batch_send_time,
        batch_send_timezone: settings.batch_send_timezone,
        batch_send_enabled: settings.batch_send_enabled,
        instant_send_enabled: settings.instant_send_enabled,
        sender_email: settings.sender_email,
        max_batch_size: settings.max_batch_size,
        retry_failed_sends: settings.retry_failed_sends,
        retry_max_attempts: settings.retry_max_attempts,
        updated_at: settings.updated_at
      }
    });

  } catch (error) {
    console.error('[SETTINGS] Failed to fetch settings:', error);
    return Response.json({
      success: false,
      error: error.message,
      settings: null
    }, { status: 500 });
  }
});
