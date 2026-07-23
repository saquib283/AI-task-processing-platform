import { Router, Request, Response, NextFunction } from 'express';
import { AuthService, AppError } from '../services/auth.service';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validators';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        message: 'Account created successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate and receive JWT tokens
 */
router.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(req.body);
      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token using a valid refresh token
 */
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token is required.', 400);
      }
      const tokens = await AuthService.refreshToken(refreshToken);
      res.json({
        message: 'Token refreshed',
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (requires auth)
 */
router.get(
  '/me',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await AuthService.getProfile(req.userId!);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
