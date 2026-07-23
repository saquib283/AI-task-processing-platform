export type OperationType = 'uppercase' | 'lowercase' | 'reverse_string' | 'word_count';
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface Task {
  _id: string;
  userId: string;
  title: string;
  inputText?: string;
  operationType: OperationType;
  status: TaskStatus;
  result: string | null;
  logs?: LogEntry[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TaskListResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskDetailResponse {
  task: Task;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}
