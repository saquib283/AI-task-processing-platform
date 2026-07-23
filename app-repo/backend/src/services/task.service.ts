import { Task } from '../models/Task';
import { taskQueue } from '../config/queue';
import { CreateTaskInput, TaskQueryInput } from '../validators/task.validators';
import { AppError } from './auth.service';

export class TaskService {
  /**
   * Create a new task and enqueue it for processing.
   */
  static async createTask(userId: string, input: CreateTaskInput) {
    const task = await Task.create({
      userId,
      title: input.title,
      inputText: input.inputText,
      operationType: input.operationType,
      status: 'pending',
      logs: [{ timestamp: new Date(), message: 'Task created and queued for processing' }],
    });

    // Enqueue job for the Python worker
    await taskQueue.add(
      'process-task',
      {
        taskId: task._id.toString(),
        operationType: task.operationType,
        inputText: task.inputText,
      },
      {
        jobId: task._id.toString(), // Prevents duplicate jobs for the same task
      }
    );

    return task;
  }

  /**
   * Get a paginated, filtered list of tasks for a user.
   */
  static async getUserTasks(userId: string, query: TaskQueryInput) {
    const filter: any = { userId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.operationType) {
      filter.operationType = query.operationType;
    }
    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .select('-inputText -logs') // Exclude large fields from list view
        .lean(),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single task by ID (full detail including logs and input).
   */
  static async getTaskById(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId }).lean();
    if (!task) {
      throw new AppError('Task not found.', 404);
    }
    return task;
  }

  /**
   * Re-run a failed task by resetting its status and re-enqueuing.
   */
  static async rerunTask(userId: string, taskId: string) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    if (task.status === 'pending' || task.status === 'running') {
      throw new AppError('Task is already pending or running.', 400);
    }

    // Reset task state
    task.status = 'pending';
    task.result = null;
    task.startedAt = null;
    task.completedAt = null;
    task.logs = [{ timestamp: new Date(), message: 'Task re-queued for processing' }];
    await task.save();

    // Re-enqueue
    await taskQueue.add(
      'process-task',
      {
        taskId: task._id.toString(),
        operationType: task.operationType,
        inputText: task.inputText,
      },
      {
        jobId: `${task._id.toString()}-${Date.now()}`, // Unique ID for re-runs
      }
    );

    return task;
  }
}
