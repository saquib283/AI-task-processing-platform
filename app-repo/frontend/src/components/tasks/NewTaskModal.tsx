'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/providers/ToastProvider';
import api from '@/lib/api';
import { OPERATION_TYPES } from '@/lib/constants';
import clsx from 'clsx';
import { AArrowUp, AArrowDown, ArrowLeftRight, Hash } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  AArrowUp: <AArrowUp className="w-5 h-5" />,
  AArrowDown: <AArrowDown className="w-5 h-5" />,
  ArrowLeftRight: <ArrowLeftRight className="w-5 h-5" />,
  Hash: <Hash className="w-5 h-5" />,
};

export default function NewTaskModal({ isOpen, onClose, onTaskCreated }: NewTaskModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [operationType, setOperationType] = useState<string>('uppercase');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (title.length > 200) newErrors.title = 'Title must be under 200 characters';
    if (!inputText.trim()) newErrors.inputText = 'Input text is required';
    if (inputText.length > 50000) newErrors.inputText = 'Input text must be under 50,000 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post('/tasks', { title: title.trim(), inputText, operationType });
      showToast('Task created and queued for processing!', 'success');
      // Reset form
      setTitle('');
      setInputText('');
      setOperationType('uppercase');
      setErrors({});
      onTaskCreated();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create task';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Task Title"
          placeholder="e.g., Convert blog post to uppercase"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        <Textarea
          label="Input Text"
          placeholder="Enter the text you want to process..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          error={errors.inputText}
          charCount={{ current: inputText.length, max: 50000 }}
          rows={6}
        />

        {/* Operation Type — Segmented Control */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Operation Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OPERATION_TYPES.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setOperationType(op.value)}
                className={clsx(
                  'flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                  operationType === op.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className={clsx(
                  'transition-colors',
                  operationType === op.value ? 'text-indigo-600' : 'text-slate-400'
                )}>
                  {iconMap[op.icon]}
                </span>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Run Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
