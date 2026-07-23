'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={clsx('animate-spin text-indigo-600', sizeMap[size], className)}
    />
  );
}
