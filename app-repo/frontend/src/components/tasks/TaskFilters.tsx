'use client';

import React from 'react';
import Select from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';

interface TaskFiltersProps {
  search: string;
  status: string;
  operationType: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onOperationTypeChange: (value: string) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

const operationOptions = [
  { value: '', label: 'All Operations' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'reverse_string', label: 'Reverse String' },
  { value: 'word_count', label: 'Word Count' },
];

export default function TaskFilters({
  search,
  status,
  operationType,
  onSearchChange,
  onStatusChange,
  onOperationTypeChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
      </div>
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        options={statusOptions}
        className="sm:w-40"
      />
      <Select
        value={operationType}
        onChange={(e) => onOperationTypeChange(e.target.value)}
        options={operationOptions}
        className="sm:w-44"
      />
    </div>
  );
}
