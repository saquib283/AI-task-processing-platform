export type OperationType = 'uppercase' | 'lowercase' | 'reverse_string' | 'word_count';
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

export interface ILogEntry {
  timestamp: Date;
  message: string;
}

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  inputText: string;
  operationType: OperationType;
  status: TaskStatus;
  result: string | null;
  logs: ILogEntry[];
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest {
  userId: string;
  email: string;
}
