import { Queue } from 'bullmq';
import { config } from './index';

export const taskQueue = new Queue('task-processing', {
  connection: {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 60 * 60, // 24 hours
    },
    removeOnFail: {
      count: 5000,
    },
  },
});

taskQueue.on('error', (err) => {
  console.error('Redis queue error:', err);
});

console.log('Redis queue initialized');
