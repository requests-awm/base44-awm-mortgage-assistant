/**
 * Seed EmailSettings Entity
 *
 * Purpose: Populate default email configuration settings
 * Includes configurable batch send time for admin flexibility
 *
 * Usage: Run once during Phase 3-01 schema setup
 */

export default async function seedEmailSettings(context: any) {
  try {
    console.log('[SEED] Starting EmailSettings seed...');

    // Check if settings already exist
    const existing = await context.entities.EmailSettings.findOne({});

    if (existing) {
      console.log('[SEED] EmailSettings already exist, skipping seed');
      return {
        success: true,
        message: 'EmailSettings already exist',
        settings: existing
      };
    }

    // Create default settings
    const settings = await context.entities.EmailSettings.create({
      batch_send_time: '16:00', // 4 PM UK time (default)
      batch_send_timezone: 'Europe/London',
      batch_send_enabled: true,
      instant_send_enabled: true,
      sender_email: 'requests@ascotwm.com',
      max_batch_size: 50, // Max emails per batch
      retry_failed_sends: true,
      retry_max_attempts: 3,
      updated_at: new Date().toISOString()
    });

    console.log('[SEED] EmailSettings created:', settings);

    return {
      success: true,
      message: 'EmailSettings seeded successfully',
      settings
    };

  } catch (error) {
    console.error('[SEED] EmailSettings seed failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
