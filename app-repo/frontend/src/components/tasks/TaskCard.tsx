'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Task } from '@/types';
import { OPERATION_TYPES } from '@/lib/constants';
import { Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
}

const opBadgeColors: Record<string, string> = {
  uppercase: 'bg-violet-100 text-violet-700',
  lowercase: 'bg-sky-100 text-sky-700',
  reverse_string: 'bg-orange-100 text-orange-700',
  word_count: 'bg-teal-100 text-teal-700',
};

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const opLabel = OPERATION_TYPES.find((o) => o.value === task.operationType)?.label || task.operationType;

  const timeAgo = formatTimeAgo(new Date(task.createdAt));

  return (
    <Card
      hover
      onClick={() => router.push(`/tasks/${task._id}`)}
      className="group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
            {task.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={clsx('px-2 py-0.5 rounded-md text-xs font-medium', opBadgeColors[task.operationType])}>
              {opLabel}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge status={task.status} size="sm" />
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
