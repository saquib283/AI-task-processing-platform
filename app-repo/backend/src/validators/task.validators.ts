import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  inputText: z
    .string()
    .min(1, 'Input text is required')
    .max(50000, 'Input text must be at most 50,000 characters'),
  operationType: z.enum(['uppercase', 'lowercase', 'reverse_string', 'word_count'], {
    errorMap: () => ({ message: 'Invalid operation type. Must be: uppercase, lowercase, reverse_string, or word_count' }),
  }),
});

export const taskQuerySchema = z.object({
  status: z.enum(['pending', 'running', 'success', 'failed']).optional(),
  operationType: z.enum(['uppercase', 'lowercase', 'reverse_string', 'word_count']).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
