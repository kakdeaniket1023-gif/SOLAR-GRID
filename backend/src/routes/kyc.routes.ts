import { Router, Response } from 'express';
import { requireAuthenticatedUser, AuthenticatedRequest } from '@/backend/auth/guards';
import { DatabaseService } from '@/backend/db';

const router = Router();

/**
 * GET /api/kyc
 */
router.get('/', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const [submission, payoutMethods] = await Promise.all([
      DatabaseService.getKycSubmissionByUserId(user.id),
      DatabaseService.getPayoutMethodsByUserId(user.id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        kycStatus: user.kycStatus || 'UNVERIFIED',
        submission,
        payoutMethods,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch KYC details',
    });
  }
});

/**
 * POST /api/kyc
 */
router.post('/', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { docType, docNumber, frontUrl, backUrl } = req.body || {};

    if (!docType || !docNumber || !frontUrl) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'docType, docNumber, and frontUrl are required',
      });
    }

    const submission = await DatabaseService.createKycSubmission({
      userId: user.id,
      docType,
      docNumber,
      frontUrl,
      backUrl,
    });

    if (!submission) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to submit KYC application',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully and pending compliance review',
      data: submission,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'KYC submission failed',
    });
  }
});

/**
 * GET /api/kyc/methods
 */
router.get('/methods', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const methods = await DatabaseService.getPayoutMethodsByUserId(user.id);
    return res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to fetch payout methods',
    });
  }
});

/**
 * POST /api/kyc/methods
 */
router.post('/methods', requireAuthenticatedUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { type, details } = req.body || {};

    if (!type || !details) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'type and details are required',
      });
    }

    const validTypes = ['USDT_TRC20', 'USDT_BEP20', 'BANK_WIRE'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: `Invalid payout method type. Supported: ${validTypes.join(', ')}`,
      });
    }

    const method = await DatabaseService.createPayoutMethod({
      userId: user.id,
      type,
      details,
    });

    if (!method) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add payout method',
      });
    }

    return res.status(201).json({
      success: true,
      data: method,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Failed to add payout method',
    });
  }
});

export default router;
