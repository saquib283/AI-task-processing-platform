'use client';

import React from 'react';
import clsx from 'clsx';
import { STATUS_CONFIG } from '@/lib/constants';
import { TaskStatus } from '@/types';

interface BadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export default function Badge({ status, size = 'md' }: BadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
