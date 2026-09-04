import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { INITIAL_PLANS, INITIAL_PROJECTS, INITIAL_BUSINESS_RULES } from '../lib/database/seed-data';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('--- Seeding SolarGrid Platform Catalog ---');

  // 1. Seed Projects
  for (const proj of INITIAL_PROJECTS) {
    const { data: existing } = await supabase.from('solar_projects').select('id').eq('name', proj.name).limit(1);
    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('solar_projects').insert({
        name: proj.name,
        description: (proj as any).description || 'Clean energy solar installation',
        location: proj.location,
        total_capacity_mw: proj.totalCapacityMw,
        current_output_mw: proj.currentOutputMw,
        efficiency_percent: proj.efficiencyPercent,
        operational_status: proj.operationalStatus,
        grid_connection: proj.gridConnection,
        image_url: proj.imageUrl,
        commissioned_date: proj.commissionedDate,
        co2_offset_tonnes: proj.co2OffsetTonnes,
        active_investors_count: proj.activeInvestorsCount,
        display_order: proj.displayOrder,
      });
      if (error) console.log('Error seeding project:', proj.name, error.message);
      else console.log('✓ Seeded project:', proj.name);
    } else {
      console.log('✓ Project exists:', proj.name);
    }
  }

  // 2. Seed Plans
  for (const plan of INITIAL_PLANS) {
    const { error } = await supabase.from('solar_plans').upsert(
      {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price_usdt: plan.priceUsdt,
        validity_days: plan.validityDays,
        working_days_total: plan.workingDaysTotal,
        daily_earning_usdt: plan.dailyEarningUsdt,
        gross_earning_usdt: plan.grossEarningUsdt,
        withdrawal_fee_percent: plan.withdrawalFeePercent,
        net_after_fee_usdt: plan.netAfterFeeUsdt,
        capacity_kw: plan.capacityKw,
        image_url: plan.imageUrl,
        features: plan.features,
        status: plan.status,
        project_location: plan.projectLocation,
        display_order: plan.displayOrder,
      },
      { onConflict: 'code' }
    );
    if (error) console.log('Error seeding plan:', plan.code, error.message);
    else console.log('✓ Seeded plan:', plan.code);
  }

  // 3. Seed Business Rules
  for (const rule of INITIAL_BUSINESS_RULES) {
    const { error } = await supabase.from('business_rules').upsert(
      {
        key: rule.key,
        value: rule.value,
        description: rule.description,
      },
      { onConflict: 'key' }
    );
    if (error) console.log('Error seeding rule:', rule.key, error.message);
    else console.log('✓ Seeded rule:', rule.key);
  }

  // 4. Seed initial unit for Sarah if she has none
  const { data: sarahUser } = await supabase.from('users').select('id').eq('email', 'sarah.jenkins@solargrid.io').single();
  if (sarahUser) {
    const { data: units } = await supabase.from('solar_units').select('id').eq('user_id', sarahUser.id);
    if (!units || units.length === 0) {
      const { data: p1 } = await supabase.from('solar_plans').select('*').eq('code', 'P1').single();
      const { data: proj } = await supabase.from('solar_projects').select('*').limit(1).single();
      if (p1 && proj) {
        await supabase.from('solar_units').insert({
          user_id: sarahUser.id,
          plan_id: p1.id,
          plan_code: p1.code,
          plan_name: p1.name,
          project_id: proj.id,
          project_name: proj.name,
          location: proj.location,
          capacity_kw: p1.capacity_kw,
          purchase_price_usdt: p1.price_usdt,
          status: 'ACTIVE',
          working_days_completed: 14,
          working_days_total: p1.working_days_total,
          total_earned_usdt: 11.2,
          today_earned_usdt: 0,
          is_receivable: false,
          receivable_amount_usdt: 0,
          purchase_date: new Date(Date.now() - 14 * 86400000).toISOString(),
          expiry_date: new Date(Date.now() + 46 * 86400000).toISOString(),
        });
        console.log('✓ Seeded initial solar unit for Sarah');
      }
    }
  }

  console.log('--- Platform Catalog Seeding Finished Successfully ---');
}

main().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
