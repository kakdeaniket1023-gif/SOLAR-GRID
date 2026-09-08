import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import all Express route modules
import authRoutes from '@/backend/src/routes/auth.routes';
import solarRoutes from '@/backend/src/routes/solar.routes';
import mlmRoutes from '@/backend/src/routes/mlm.routes';
import networkRoutes from '@/backend/src/routes/network.routes';
import dashboardRoutes from '@/backend/src/routes/dashboard.routes';
import pointsRoutes from '@/backend/src/routes/points.routes';
import rechargeRoutes from '@/backend/src/routes/recharge.routes';
import withdrawalsRoutes from '@/backend/src/routes/withdrawals.routes';
import ordersRoutes from '@/backend/src/routes/orders.routes';
import productsRoutes from '@/backend/src/routes/products.routes';
import kycRoutes from '@/backend/src/routes/kyc.routes';
import leadershipRoutes from '@/backend/src/routes/leadership.routes';
import notificationsRoutes from '@/backend/src/routes/notifications.routes';
import supportRoutes from '@/backend/src/routes/support.routes';
import contactRoutes from '@/backend/src/routes/contact.routes';
import commissionsRoutes from '@/backend/src/routes/commissions.routes';
import paymentsRoutes from '@/backend/src/routes/payments.routes';
import adminRoutes from '@/backend/src/routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 5001;

// Allowed frontend origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://solargrid.pages.dev',
].filter(Boolean) as string[];

// CORS configuration supporting credentials (cookies and authorization headers)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production' ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.solargrid.io')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev/staging
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'cf-connecting-ip', 'x-real-ip'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust first proxy hop (Cloudflare, Render, AWS ALB, Nginx)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'solargrid-backend-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/solar', solarRoutes);
app.use('/api/mlm', mlmRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Catch-All
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred on the server.',
  });
});

// Start Express server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ SolarGrid Express API server is running on http://localhost:${PORT}`);
    console.log(`🔌 Health check available at http://localhost:${PORT}/health`);
  });
}

export default app;
