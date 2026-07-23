'use client';

import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { LogEntry } from '@/types';

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  maxHeight?: string;
}

export default function LogViewer({ logs, className, maxHeight = '400px' }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className={clsx('bg-slate-900 rounded-lg p-6 text-center', className)}>
        <p className="text-slate-500 text-sm font-mono">No logs yet...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'bg-slate-900 rounded-lg p-4 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600',
        className
      )}
      style={{ maxHeight }}
    >
      <div className="space-y-1">
        {logs.map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
          });

          const isError = log.message.toLowerCase().includes('failed') || log.message.toLowerCase().includes('error');
          const isSuccess = log.message.toLowerCase().includes('completed') || log.message.toLowerCase().includes('success');

          return (
            <div key={index} className="flex gap-3 font-mono text-xs leading-relaxed">
              <span className="text-slate-500 shrink-0 select-none">{time}</span>
              <span
                className={clsx(
                  isError ? 'text-red-400' :
                  isSuccess ? 'text-emerald-400' :
                  'text-slate-300'
                )}
              >
                {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
