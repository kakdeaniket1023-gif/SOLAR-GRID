import { Router, Response } from 'express';
import { requireAuthenticatedUser, requireSuperAdmin, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { MLMService } from '@/backend/engines/mlm-engine';

const router = Router();

/**
 * GET /api/orders
 */
router.get('/', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const viewAll = req.query.all === 'true';

    if (viewAll && user.role === 'SUPER_ADMIN') {
      const orders = await DatabaseService.getAllOrders();
      return res.status(200).json({ success: true, data: orders });
    }

    const orders = await DatabaseService.getOrdersByUserId(user.id);
    return res.status(200).json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch orders',
    });
  }
});

/**
 * POST /api/orders
 */
router.post('/', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { items, shippingAddress } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Order must contain at least one item',
      });
    }

    let calculatedTotal = 0;
    let calculatedPv = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      productSku: string;
      qty: number;
      unitPrice: number;
      pvAmount: number;
    }> = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const product = await DatabaseService.getProductById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'PRODUCT_NOT_FOUND',
          message: `Product ${item.productId} not found`,
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          error: 'PRODUCT_INACTIVE',
          message: `Product ${product.name} is currently unavailable`,
        });
      }

      const itemTotal = Math.round(product.retailPrice * qty * 100) / 100;
      const itemPv = Math.round(product.commissionableValue * qty * 100) / 100;

      calculatedTotal += itemTotal;
      calculatedPv += itemPv;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        qty,
        unitPrice: product.retailPrice,
        pvAmount: itemPv,
      });
    }

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;
    calculatedPv = Math.round(calculatedPv * 100) / 100;

    const orderResult = await DatabaseService.createOrder({
      userId: user.id,
      shippingAddress: shippingAddress || {},
      items: validatedItems.map((it) => ({
        productId: it.productId,
        qty: it.qty,
      })),
    });

    if (!orderResult.success || !orderResult.order) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: orderResult.message || 'Failed to create order',
      });
    }

    const createdOrder = orderResult.order;

    return res.status(200).json({
      success: true,
      data: createdOrder,
      paymentInstructions: {
        amount: createdOrder.totalAmount,
        currency: 'USDT',
        orderId: createdOrder.id,
        orderNo: createdOrder.orderNo,
        webhookUrl: '/api/payments/webhook',
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to create order',
    });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const order = await DatabaseService.getOrderById(String(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Order not found' });
    }

    if (order.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You do not have access to this order' });
    }

    const commissions = await DatabaseService.getCommissionsByOrderId(order.id);

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        commissions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch order',
    });
  }
});

/**
 * POST /api/orders/:id
 */
router.post('/:id', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const order = await DatabaseService.getOrderById(String(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Order not found' });
    }

    if (order.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Unauthorized' });
    }

    const { action } = req.body || {};

    if (action === 'CANCEL') {
      if (order.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: `Cannot cancel an order that is already ${order.status}`,
        });
      }

      await DatabaseService.updateOrderStatus(order.id, 'CANCELLED');
      return res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
      });
    }

    return res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      message: 'Invalid action. Supported actions: CANCEL.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Order action failed',
    });
  }
});

/**
 * POST /api/orders/:id/refund (Super Admin)
 */
router.post('/:id/refund', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = req.user!;
    const order = await DatabaseService.getOrderById(String(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Order not found' });
    }

    if (order.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: `Cannot refund order with status ${order.status}. Must be PAID.`,
      });
    }

    const reason = req.body?.reason || 'Admin refund processing';

    await DatabaseService.updateOrderStatus(order.id, 'REFUNDED');
    const clawedBack = await MLMService.clawbackOrderCommissions(order.id, reason);

    await DatabaseService.addAuditLog({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'ORDER_REFUNDED',
      targetType: 'ORDER',
      targetId: order.id,
      details: {
        orderId: order.id,
        orderNo: order.orderNo,
        reason,
        clawedBackCount: clawedBack.length,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderNo} successfully refunded. ${clawedBack.length} commission(s) clawed back.`,
      clawedBack,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Refund processing failed',
    });
  }
});

export default router;
