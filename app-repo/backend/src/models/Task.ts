import mongoose, { Schema, Document } from 'mongoose';
import { OperationType, TaskStatus, ILogEntry } from '../types';

export interface ITaskDocument extends Document {
  userId: mongoose.Types.ObjectId;
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

const logEntrySchema = new Schema<ILogEntry>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    message: { type: String, required: true },
  },
  { _id: false }
);

const taskSchema = new Schema<ITaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    inputText: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    operationType: {
      type: String,
      required: true,
      enum: ['uppercase', 'lowercase', 'reverse_string', 'word_count'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'running', 'success', 'failed'],
      default: 'pending',
      index: true,
    },
    result: {
      type: String,
      default: null,
    },
    logs: {
      type: [logEntrySchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fetching user tasks sorted by newest first
taskSchema.index({ userId: 1, createdAt: -1 });

// Index for filtering tasks by status
taskSchema.index({ status: 1, createdAt: -1 });

export const Task = mongoose.model<ITaskDocument>('Task', taskSchema);
