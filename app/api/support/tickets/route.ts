import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { SupabaseDatabaseService } from '@/lib/supabase/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    let tickets;
    if (auth.user.role === 'SUPER_ADMIN') {
      // Super admin can view all platform tickets if no specific userId is requested
      tickets = await SupabaseDatabaseService.getSupportTickets(requestedUserId || undefined);
    } else {
      // Regular users are strictly restricted to their own tickets
      tickets = await SupabaseDatabaseService.getSupportTickets(auth.user.id);
    }

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.authorized || !auth.user) {
      return auth.errorResponse || NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '401 Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { ticketId, message, status, category, priority, subject } = body;

    // Operation 1: Status resolution / update on existing ticket
    if (ticketId && status) {
      const ticket = await SupabaseDatabaseService.getSupportTicketById(ticketId);
      if (!ticket) {
        return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
      }
      if (ticket.userId !== auth.user.id && auth.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Cannot update status of another user ticket' },
          { status: 403 }
        );
      }
      const updated = await SupabaseDatabaseService.updateSupportTicket(ticketId, { status });
      return NextResponse.json({ success: true, ticket: updated, message: `Ticket status updated to ${status}` });
    }

    // Operation 2: Append reply message to existing ticket
    if (ticketId && message) {
      const ticket = await SupabaseDatabaseService.getSupportTicketById(ticketId);
      if (!ticket) {
        return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
      }
      if (ticket.userId !== auth.user.id && auth.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: '403 Forbidden: Cannot message on another user ticket' },
          { status: 403 }
        );
      }
      const newMsg = await SupabaseDatabaseService.addSupportMessage({
        ticketId,
        senderId: auth.user.id,
        senderName: auth.user.name,
        senderRole: auth.user.role,
        message: message.trim(),
      });

      if (auth.user.role === 'SUPER_ADMIN' && ticket.status === 'OPEN') {
        await SupabaseDatabaseService.updateSupportTicket(ticketId, { status: 'IN_PROGRESS' });
      }

      return NextResponse.json({ success: true, message: 'Reply submitted successfully', msg: newMsg });
    }

    // Operation 3: New ticket creation
    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'subject and message are required' }, { status: 400 });
    }

    const ticket = await SupabaseDatabaseService.createSupportTicket({
      userId: auth.user.id,
      userName: auth.user.name,
      userEmail: auth.user.email,
      category: category || 'TECHNICAL',
      priority: priority || 'MEDIUM',
      subject: subject.trim(),
    });

    await SupabaseDatabaseService.addSupportMessage({
      ticketId: ticket.id,
      senderId: auth.user.id,
      senderName: auth.user.name,
      senderRole: auth.user.role,
      message: message.trim(),
    });

    return NextResponse.json({ success: true, ticket, message: 'Support ticket submitted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Failed to process support request' }, { status: 500 });
  }
}
