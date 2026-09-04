import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json(
      { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
      { status: 403 }
    );
  }

  const rules = await SupabaseDatabaseService.getBusinessRules();
  return NextResponse.json({ success: true, rules });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json(
      { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Super Administrator access required' },
      { status: 403 }
    );
  }

  try {
    const { key, value } = await request.json().catch(() => ({}));
    if (!key || value === undefined) {
      return NextResponse.json({ success: false, message: 'key and value are required' }, { status: 400 });
    }

    const updated = await SupabaseDatabaseService.updateBusinessRule(key, value);
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Failed to update rule' }, { status: 400 });
    }

    await SupabaseDatabaseService.addAuditLog({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: 'SUPER_ADMIN',
      action: 'UPDATE_BUSINESS_RULE',
      targetType: 'SYSTEM_SETTINGS',
      targetId: key,
      details: { key, newValue: value },
    });

    return NextResponse.json({ success: true, message: `Rule ${key} updated successfully` });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to update rule' }, { status: 500 });
  }
}
