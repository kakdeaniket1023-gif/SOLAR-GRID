import { Router, Request, Response } from 'express';
import { requireSuperAdmin, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { Product } from '@/types';

const router = Router();

/**
 * GET /api/products
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string | undefined) || undefined;
    const includeInactive = req.query.all === 'true';

    let products = await DatabaseService.getAllProducts(!includeInactive);
    if (category) {
      products = products.filter((p: Product) => p.category.toLowerCase() === category.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch products',
    });
  }
});

/**
 * POST /api/products (Super Admin)
 */
router.post('/', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sku, name, description, retailPrice, commissionableValue, category, imageUrl, isActive } = req.body || {};

    if (!sku || !name || retailPrice === undefined || commissionableValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'sku, name, retailPrice, and commissionableValue are required',
      });
    }

    const product = await DatabaseService.createProduct({
      sku,
      name,
      description: description || '',
      retailPrice: Number(retailPrice),
      commissionableValue: Number(commissionableValue),
      category: category || 'Solar Equipment',
      imageUrl: imageUrl || undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    if (!product) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product',
      });
    }

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to create product',
    });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await DatabaseService.getProductById(String(req.params.id));
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch product',
    });
  }
});

/**
 * PUT /api/products/:id (Super Admin)
 */
router.put('/:id', requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await DatabaseService.updateProduct(String(req.params.id), req.body || {});
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Product not found or update failed',
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to update product',
    });
  }
});

export default router;
