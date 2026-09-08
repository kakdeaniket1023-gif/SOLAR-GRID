import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/backend/db';
import { MLMService } from '@/backend/engines/mlm-engine';
import { WEBHOOK_SIGNATURE_HEADER, verifyWebhookSignature } from '@/backend/security/webhook-signature';

const router = Router();

/**
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.length < 16) {
      return res.status(503).json({
        success: false,
        error: 'WEBHOOK_NOT_CONFIGURED',
        message: 'PAYMENT_WEBHOOK_SECRET is not configured (min 16 chars).',
      });
    }

    const signature =
      (req.headers[WEBHOOK_SIGNATURE_HEADER.toLowerCase()] as string) ||
      (req.headers['x-signature'] as string) ||
      (req.headers['stripe-signature'] as string);

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_SIGNATURE',
        message: 'Webhook signature verification failed',
      });
    }

    let payload: any = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return res.status(400).json({ success: false, error: 'INVALID_JSON', message: 'Invalid JSON payload' });
      }
    }

    const { event, data } = payload || {};
    if (!event || !data) {
      return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Missing event or data in webhook' });
    }

    const orderId = data.orderId || data.order_id;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Missing orderId in event data' });
    }

    const order = await DatabaseService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND', message: `Order ${orderId} not found` });
    }

    switch (event) {
      case 'order.paid':
      case 'payment.succeeded':
      case 'charge.success': {
        if (order.status === 'PAID') {
          return res.status(200).json({ success: true, message: 'Order already processed as PAID' });
        }

        const receivedAmount = Number(data.amount || data.totalAmount || order.totalAmount);
        if (receivedAmount < order.totalAmount) {
          return res.status(400).json({
            success: false,
            error: 'UNDERPAID',
            message: `Amount paid ${receivedAmount} is less than order total ${order.totalAmount}`,
          });
        }

        const gatewayRef = data.paymentGatewayRef || data.txHash || data.id || `gw_${Date.now()}`;

        await DatabaseService.updateOrderStatus(order.id, 'PAID', gatewayRef);
        const commissions = await MLMService.distributeOrderCommissions(order.id);

        return res.status(200).json({
          success: true,
          message: `Order #${order.orderNo} marked as PAID. ${commissions.length} direct commissions distributed.`,
          commissionsCount: commissions.length,
        });
      }

      case 'order.refunded':
      case 'payment.refunded':
      case 'charge.refunded': {
        if (order.status === 'REFUNDED') {
          return res.status(200).json({ success: true, message: 'Order already processed as REFUNDED' });
        }

        const reason = data.reason || 'Customer refund requested';

        await DatabaseService.updateOrderStatus(order.id, 'REFUNDED');
        const clawbacks = await MLMService.clawbackOrderCommissions(order.id, reason);

        return res.status(200).json({
          success: true,
          message: `Order #${order.orderNo} refunded. ${clawbacks.length} commissions clawed back.`,
          clawbacksCount: clawbacks.length,
        });
      }

      default:
        return res.status(200).json({ success: true, message: `Ignored unhandled event: ${event}` });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Webhook failed',
    });
  }
});

export default router;
