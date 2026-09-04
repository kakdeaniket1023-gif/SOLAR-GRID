import { NextRequest, NextResponse } from 'next/server';
import { SupabaseDatabaseService } from '@/lib/supabase/db';
import { requireSuperAdmin } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const images = await SupabaseDatabaseService.getPanelImages();
    return NextResponse.json({ success: true, images });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { planCode, imageUrl, caption } = await request.json().catch(() => ({}));
    if (!planCode || !imageUrl) {
      return NextResponse.json({ success: false, message: 'planCode and imageUrl are required' }, { status: 400 });
    }

    const updated = await SupabaseDatabaseService.updatePanelImage(planCode, imageUrl, caption);

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Panel image configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Panel image for ${planCode} updated`, image: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
