'use client';

import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  charCount?: { current: number; max: number };
}

const baseInputStyles = clsx(
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
  'transition-colors duration-150'
);

const errorInputStyles = 'border-red-300 focus:ring-red-500/20 focus:border-red-500';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(baseInputStyles, error && errorInputStyles, className)}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, charCount, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(baseInputStyles, 'resize-y min-h-[120px]', error && errorInputStyles, className)}
          {...props}
        />
        <div className="flex justify-between">
          <div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
          </div>
          {charCount && (
            <p className={clsx(
              'text-xs',
              charCount.current > charCount.max ? 'text-red-600' : 'text-slate-400'
            )}>
              {charCount.current.toLocaleString()} / {charCount.max.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
