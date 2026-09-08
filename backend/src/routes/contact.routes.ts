import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DatabaseService } from '@/backend/db';
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from '@/backend/security/rate-limiter';

const router = Router();

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

/**
 * POST /api/contact
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.general, res)) return;

    const parseResult = ContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parseResult.error.errors[0]?.message || 'Invalid parameters',
      });
    }

    const { name, email, subject, message } = parseResult.data;

    await DatabaseService.addAuditLog({
      actorId: 'public-visitor',
      actorEmail: email,
      actorRole: 'USER',
      action: 'PUBLIC_CONTACT_INQUIRY',
      targetType: 'SUPPORT',
      targetId: 'inquiry-' + Date.now(),
      details: { name, email, subject, messagePreview: message.substring(0, 100) },
      ipAddress: clientIp,
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your message has been received. Our team will contact you shortly.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to send message. Please try again.',
    });
  }
});

export default router;
