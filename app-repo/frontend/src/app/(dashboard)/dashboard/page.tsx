'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { TaskCardSkeleton } from '@/components/ui/Skeleton';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFilters from '@/components/tasks/TaskFilters';
import NewTaskModal from '@/components/tasks/NewTaskModal';
import EmptyState from '@/components/tasks/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import api from '@/lib/api';
import { Task, TaskListResponse } from '@/types';
import { Plus, RefreshCw } from 'lucide-react';
import { POLL_INTERVAL_MS } from '@/lib/constants';

export default function DashboardPage() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [operationType, setOperationType] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (operationType) params.operationType = operationType;

      const { data } = await api.get<TaskListResponse>('/tasks', { params });
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      showToast('Failed to fetch tasks', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status, operationType, showToast]);

  // Initial fetch and on filter change
  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  // Poll for status updates when there are pending/running tasks
  useEffect(() => {
    const hasPendingOrRunning = tasks.some((t) => t.status === 'pending' || t.status === 'running');
    if (!hasPendingOrRunning) return;

    const interval = setInterval(() => {
      fetchTasks(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [tasks, fetchTasks]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, operationType]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} task${total !== 1 ? 's' : ''} total` : 'Manage your AI tasks'}
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          size="md"
        >
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        search={search}
        status={status}
        operationType={operationType}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onOperationTypeChange={setOperationType}
      />

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        total === 0 && !search && !status && !operationType ? (
          <EmptyState onCreateTask={() => setIsModalOpen(true)} />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No tasks match your filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setSearch(''); setStatus(''); setOperationType(''); }}
            >
              Clear filters
            </Button>
          </div>
        )
      ) : (
        <>
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={() => fetchTasks(true)}
      />
    </div>
  );
}
