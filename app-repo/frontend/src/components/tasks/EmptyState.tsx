'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  onCreateTask: () => void;
}

export default function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
        <ClipboardList className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">No tasks yet</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">
        Create your first AI task to get started. Choose an operation type and provide some input text to process.
      </p>
      <Button onClick={onCreateTask} size="lg">
        Create Your First Task
      </Button>
    </div>
  );
}
