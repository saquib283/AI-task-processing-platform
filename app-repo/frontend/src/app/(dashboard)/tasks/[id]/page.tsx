'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Task, TaskDetailResponse } from '@/types';
import { OPERATION_TYPES, STATUS_CONFIG, POLL_INTERVAL_MS } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LogViewer from '@/components/ui/LogViewer';
import Skeleton from '@/components/ui/Skeleton';
import Spinner from '@/components/ui/Spinner';
import { ArrowLeft, RotateCcw, Clock, Play, CheckCircle, XCircle, FileText, Terminal, Info } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'result' | 'logs' | 'metadata';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('result');

  const taskId = params.id as string;

  const fetchTask = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const { data } = await api.get<TaskDetailResponse>(`/tasks/${taskId}`);
      setTask(data.task);
    } catch (err: any) {
      if (err.response?.status === 404) {
        showToast('Task not found', 'error');
        router.push('/dashboard');
      } else {
        showToast('Failed to fetch task details', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [taskId, showToast, router]);

  useEffect(() => {
    fetchTask(true);
  }, [fetchTask]);

  // Poll while pending/running
  useEffect(() => {
    if (!task || (task.status !== 'pending' && task.status !== 'running')) return;

    const interval = setInterval(() => {
      fetchTask(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [task, fetchTask]);

  const handleRerun = async () => {
    setIsRerunning(true);
    try {
      await api.post(`/tasks/${taskId}/rerun`);
      showToast('Task re-queued for processing', 'success');
      fetchTask(false);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to re-run task';
      showToast(message, 'error');
    } finally {
      setIsRerunning(false);
    }
  };

  const opLabel = task ? OPERATION_TYPES.find((o) => o.value === task.operationType)?.label : '';

  const tabs = [
    { key: 'result' as Tab, label: 'Result', icon: FileText },
    { key: 'logs' as Tab, label: 'Execution Logs', icon: Terminal },
    { key: 'metadata' as Tab, label: 'Metadata', icon: Info },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton variant="rectangular" className="h-20 col-span-1" />
          <Skeleton variant="rectangular" className="h-20 col-span-1" />
          <Skeleton variant="rectangular" className="h-20 col-span-1" />
        </div>
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
              <Badge status={task.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {opLabel} • Created {new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Re-run button */}
        {(task.status === 'success' || task.status === 'failed') && (
          <Button
            variant="secondary"
            onClick={handleRerun}
            isLoading={isRerunning}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Re-run
          </Button>
        )}
      </div>

      {/* Status timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(task.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Started</p>
              <p className="text-sm font-medium text-slate-900">
                {task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : '—'}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              task.status === 'success' ? 'bg-emerald-50' : task.status === 'failed' ? 'bg-red-50' : 'bg-slate-50'
            )}>
              {task.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : task.status === 'failed' ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Clock className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-sm font-medium text-slate-900">
                {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loading indicator for pending/running */}
      {(task.status === 'pending' || task.status === 'running') && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Spinner size="sm" />
          <p className="text-sm text-blue-700">
            {task.status === 'pending' ? 'Task is queued and waiting to be processed...' : 'Task is currently being processed...'}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'result' && (
          <Card>
            {task.result ? (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Processing Result</h3>
                <pre className="bg-slate-50 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap break-words font-mono border border-slate-200">
                  {task.result}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">
                  {task.status === 'failed' ? 'Task failed — no result available.' : 'Result will appear here once processing is complete.'}
                </p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'logs' && (
          <LogViewer logs={task.logs || []} maxHeight="500px" />
        )}

        {activeTab === 'metadata' && (
          <Card>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Task ID</p>
                  <p className="text-sm font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md">{task._id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Operation Type</p>
                  <p className="text-sm font-medium text-slate-900">{opLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <Badge status={task.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Input Length</p>
                  <p className="text-sm text-slate-700">{task.inputText?.length?.toLocaleString() || '—'} characters</p>
                </div>
              </div>
              {task.inputText && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Input Text</p>
                  <pre className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap break-words border border-slate-200 max-h-48 overflow-y-auto">
                    {task.inputText}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
