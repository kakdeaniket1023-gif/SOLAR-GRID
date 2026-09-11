import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireSuperAdmin, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';
import { Product } from '@/types';

const router = Router();

const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().default(''),
  retailPrice: z.number().positive('Retail price must be positive'),
  commissionableValue: z.number().nonnegative('Commissionable value must be non-negative'),
  category: z.string().optional().default('Solar Equipment'),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

const UpdateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  retailPrice: z.number().positive().optional(),
  commissionableValue: z.number().nonnegative().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

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
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message || 'Invalid product data',
      });
    }

    const product = await DatabaseService.createProduct({
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description || '',
      retailPrice: parsed.data.retailPrice,
      commissionableValue: parsed.data.commissionableValue,
      category: parsed.data.category,
      imageUrl: parsed.data.imageUrl,
      isActive: parsed.data.isActive,
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
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.errors[0]?.message || 'Invalid update parameters',
      });
    }

    const updated = await DatabaseService.updateProduct(String(req.params.id), parsed.data);
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
