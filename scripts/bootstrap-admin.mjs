#!/usr/bin/env node
/**
 * Bootstrap script to create the first admin user.
 * Run this ONCE after initial deployment.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/bootstrap-admin.mjs
 *
 * IMPORTANT: Remove or secure this script after use.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@macelleria-amici.it';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ADMIN_PASSWORD) {
  console.error('Missing required environment variables:');
  console.error('  SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  ADMIN_PASSWORD');
  process.exit(1);
}

async function bootstrap() {
  // Dynamic import
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Creating admin user: ${ADMIN_EMAIL}`);

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Skip email verification
    user_metadata: {
      first_name: 'Admin',
      last_name: 'Macelleria',
      username: 'admin_amici',
    },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists. Updating role...');

      // Find user
      const { data: users } = await supabase.auth.admin.listUsers();
      const adminUser = users?.users?.find(u => u.email === ADMIN_EMAIL);

      if (adminUser) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', adminUser.id);

        if (error) {
          console.error('Failed to update role:', error.message);
          process.exit(1);
        }
        console.log('✅ Admin role updated successfully');
      }
    } else {
      console.error('Failed to create user:', authError.message);
      process.exit(1);
    }
  } else {
    // Step 2: Set admin role in profile
    // The trigger should have created the profile, just update the role
    const userId = authData.user.id;

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) {
      console.error('Failed to set admin role:', error.message);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully');
  }

  console.log(`
  ================================
  Admin credentials:
    Email: ${ADMIN_EMAIL}
    URL:   ${SUPABASE_URL}/admin
  ================================

  ⚠️  IMPORTANT: Change the password after first login.
  ⚠️  Delete or secure this script.
  `);
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
