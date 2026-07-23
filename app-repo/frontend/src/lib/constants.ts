export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const OPERATION_TYPES = [
  { value: 'uppercase' as const, label: 'Uppercase', icon: 'AArrowUp' },
  { value: 'lowercase' as const, label: 'Lowercase', icon: 'AArrowDown' },
  { value: 'reverse_string' as const, label: 'Reverse String', icon: 'ArrowLeftRight' },
  { value: 'word_count' as const, label: 'Word Count', icon: 'Hash' },
] as const;

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  running: { label: 'Running', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  success: { label: 'Success', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
} as const;

export const POLL_INTERVAL_MS = 2000;
