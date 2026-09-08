import { Router, Response } from 'express';
import { requireUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/support/tickets
 */
router.get('/tickets', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const requestedUserId = req.query.userId as string | undefined;

    let tickets;
    if (user.role === 'SUPER_ADMIN') {
      tickets = await DatabaseService.getSupportTickets(requestedUserId || undefined);
    } else {
      tickets = await DatabaseService.getSupportTickets(user.id);
    }

    return res.status(200).json({ success: true, tickets });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch support tickets' });
  }
});

/**
 * POST /api/support/tickets
 */
router.post('/tickets', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { ticketId, message, status, category, priority, subject } = req.body || {};

    if (ticketId && status) {
      const ticket = await DatabaseService.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      if (ticket.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: '403 Forbidden: Cannot update status of another user ticket',
        });
      }
      const updated = await DatabaseService.updateSupportTicket(ticketId, { status });
      return res.status(200).json({ success: true, ticket: updated, message: `Ticket status updated to ${status}` });
    }

    if (ticketId && message) {
      const ticket = await DatabaseService.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      if (ticket.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: '403 Forbidden: Cannot message on another user ticket',
        });
      }
      const newMsg = await DatabaseService.addSupportMessage({
        ticketId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: String(message).trim(),
      });

      if (user.role === 'SUPER_ADMIN' && ticket.status === 'OPEN') {
        await DatabaseService.updateSupportTicket(ticketId, { status: 'IN_PROGRESS' });
      }

      return res.status(200).json({ success: true, message: 'Reply submitted successfully', msg: newMsg });
    }

    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'subject and message are required' });
    }

    const ticket = await DatabaseService.createSupportTicket({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      category: category || 'TECHNICAL',
      priority: priority || 'MEDIUM',
      subject: String(subject).trim(),
    });

    await DatabaseService.addSupportMessage({
      ticketId: ticket.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: String(message).trim(),
    });

    return res.status(201).json({ success: true, ticket, message: 'Support ticket submitted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to process support request' });
  }
});

export default router;
