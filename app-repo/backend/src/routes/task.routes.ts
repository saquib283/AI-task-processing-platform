import { Router, Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createTaskSchema, taskQuerySchema } from '../validators/task.validators';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);
router.use(apiLimiter);

/**
 * POST /api/tasks
 * Create a new task and enqueue it for processing
 */
router.post(
  '/',
  validateBody(createTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.createTask(req.userId!, req.body);
      res.status(201).json({
        message: 'Task created and queued for processing',
        task,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tasks
 * List user's tasks with filtering, search, and pagination
 */
router.get(
  '/',
  validateQuery(taskQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TaskService.getUserTasks(req.userId!, req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tasks/:id
 * Get full task detail including logs and result
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id as string;
      const task = await TaskService.getTaskById(req.userId!, taskId);
      res.json({ task });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tasks/:id/rerun
 * Re-run a failed/completed task
 */
router.post(
  '/:id/rerun',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params.id as string;
      const task = await TaskService.rerunTask(req.userId!, taskId);
      res.json({
        message: 'Task re-queued for processing',
        task,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
