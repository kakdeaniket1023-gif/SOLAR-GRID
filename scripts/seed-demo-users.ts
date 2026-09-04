import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed demo users.');
  console.error('Do not use client-side anon key for database bootstrapping.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function getOrCreateAuthUser(email: string, password: string, name: string): Promise<string> {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`Updating existing auth user: ${email} (${existing.id})`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (updateError) {
      throw new Error(`Failed to update password for ${email}: ${updateError.message}`);
    }
    return existing.id;
  } else {
    console.log(`Creating new auth user: ${email}`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createError || !createData.user) {
      throw new Error(`Failed to create user ${email}: ${createError?.message}`);
    }
    return createData.user.id;
  }
}

async function seed() {
  console.log('--- Starting SolarGrid Supabase Demo User Seeding ---');

  // 1. Seed Marcus Vance (SUPER_ADMIN)
  const marcusEmail = 'marcus.vance@solargrid.io';
  const marcusPass = 'adminPass123';
  const marcusName = 'Marcus Vance';
  const marcusId = await getOrCreateAuthUser(marcusEmail, marcusPass, marcusName);

  const bcrypt = require('bcryptjs');

  const { error: marcusUserErr } = await supabase.from('users').upsert(
    {
      id: marcusId,
      email: marcusEmail,
      name: marcusName,
      phone: '+1 (555) 019-2834',
      country: 'United States',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      referral_code: 'SG-ADMIN01',
      sponsor_id: null,
      leadership_level: 'SOLAR_DIRECTOR',
      points: 100,
      available_balance: 5000.0,
      total_earned: 12500.0,
      password_hash: bcrypt.hashSync(marcusPass, 10),
      failed_login_attempts: 0,
      locked_until: null,
    },
    { onConflict: 'id' }
  );
  if (marcusUserErr) throw marcusUserErr;

  const { error: marcusProfErr } = await supabase.from('profiles').upsert(
    {
      user_id: marcusId,
      bio: 'Executive System Administrator for SolarGrid Infrastructure.',
      wallet_address: 'TX9d823489247823748293748239748923',
      wallet_network: 'USDT-TRC20',
      wallet_verified: true,
      preferred_currency: 'USDT',
      two_factor_enabled: true,
      email_notifications: true,
      push_notifications: true,
      telegram_handle: '@marcus_solargrid',
    },
    { onConflict: 'user_id' }
  );
  if (marcusProfErr) throw marcusProfErr;
  console.log(`✓ Super Admin seeded: ${marcusEmail} (${marcusId})`);

  // 2. Seed Sarah Jenkins (USER)
  const sarahEmail = 'sarah.jenkins@solargrid.io';
  const sarahPass = 'password123';
  const sarahName = 'Sarah Jenkins';
  const sarahId = await getOrCreateAuthUser(sarahEmail, sarahPass, sarahName);

  const { error: sarahUserErr } = await supabase.from('users').upsert(
    {
      id: sarahId,
      email: sarahEmail,
      name: sarahName,
      phone: '+1 (555) 234-5678',
      country: 'United States',
      role: 'USER',
      status: 'ACTIVE',
      referral_code: 'SG-SARAH1',
      sponsor_id: marcusId,
      leadership_level: 'SOLAR_MEMBER',
      points: 70,
      available_balance: 145.6,
      total_earned: 382.4,
      password_hash: bcrypt.hashSync(sarahPass, 10),
      failed_login_attempts: 0,
      locked_until: null,
    },
    { onConflict: 'id' }
  );
  if (sarahUserErr) throw sarahUserErr;

  const { error: sarahProfErr } = await supabase.from('profiles').upsert(
    {
      user_id: sarahId,
      bio: 'Clean tech enthusiast and distributed solar farm backer.',
      wallet_address: 'TY5a718392019284719284719284719283',
      wallet_network: 'USDT-TRC20',
      wallet_verified: true,
      preferred_currency: 'USDT',
      two_factor_enabled: false,
      email_notifications: true,
      push_notifications: true,
      telegram_handle: '@sarah_j_solar',
    },
    { onConflict: 'user_id' }
  );
  if (sarahProfErr) throw sarahProfErr;
  console.log(`✓ User seeded: ${sarahEmail} (${sarahId})`);

  // 3. Seed units for Sarah if none exist
  const { data: existingUnits } = await supabase.from('solar_units').select('id').eq('user_id', sarahId);
  if (!existingUnits || existingUnits.length === 0) {
    const { data: plans } = await supabase.from('solar_plans').select('*');
    const { data: projects } = await supabase.from('solar_projects').select('*');

    const p1Plan = plans?.find((p) => p.code === 'P1') || plans?.[0];
    const project = projects?.[0];

    if (p1Plan && project) {
      await supabase.from('solar_units').insert([
        {
          user_id: sarahId,
          plan_id: p1Plan.id,
          plan_code: p1Plan.code,
          plan_name: p1Plan.name,
          project_id: project.id,
          project_name: project.name,
          location: project.location,
          capacity_kw: p1Plan.capacity_kw,
          purchase_price_usdt: p1Plan.price_usdt,
          status: 'ACTIVE',
          working_days_completed: 12,
          working_days_total: p1Plan.working_days_total,
          total_earned_usdt: 14.4,
          today_earned_usdt: 0,
          is_receivable: false,
          receivable_amount_usdt: 0,
          purchase_date: new Date(Date.now() - 14 * 86400000).toISOString(),
          expiry_date: new Date(Date.now() + 46 * 86400000).toISOString(),
        },
      ]);
      console.log('✓ Seeded initial solar unit for Sarah');
    }
  }

  console.log('--- Seeding Completed Successfully ---');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
