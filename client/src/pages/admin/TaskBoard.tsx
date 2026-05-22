import { useState, useCallback, DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  Trash2,
  Loader2,
  CalendarDays,
  X,
  GripVertical,
  Check,
  Pencil,
  Settings2,
  AlertCircle,
  Circle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string | null;
  project: string | null;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  project: string;
  priority: TaskPriority;
  due_date: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------

const TEAM_MEMBERS = ['Kerry', 'Simon', 'Sabrina', 'Jonathan', 'Luis', 'Gabriela'];

const PROJECT_COLOR_OPTIONS = [
  { value: 'emerald', label: 'Green', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'amber', label: 'Yellow', bg: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 ring-purple-200' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500', light: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  { value: 'gray', label: 'Gray', bg: 'bg-gray-400', light: 'bg-gray-100 text-gray-600 ring-gray-200' },
];

const COLUMNS: { key: TaskStatus; label: string; icon: typeof Circle; iconColor: string }[] = [
  { key: 'todo', label: 'To Do', icon: Circle, iconColor: 'text-gray-500' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, iconColor: 'text-blue-600' },
  { key: 'done', label: 'Done', icon: CheckCircle2, iconColor: 'text-emerald-600' },
];

const PRIORITY_META: Record<TaskPriority, { border: string; dot: string; label: string; textColor: string }> = {
  low: { border: 'border-l-gray-200', dot: 'bg-gray-300', label: 'Low', textColor: 'text-gray-400' },
  medium: { border: 'border-l-amber-300', dot: 'bg-amber-400', label: 'Medium', textColor: 'text-amber-600' },
  high: { border: 'border-l-orange-400', dot: 'bg-orange-500', label: 'High', textColor: 'text-orange-600' },
  urgent: { border: 'border-l-red-500', dot: 'bg-red-500', label: 'Urgent', textColor: 'text-red-600' },
};

const ASSIGNEE_COLORS: Record<string, string> = {
  Kerry: 'bg-violet-600',
  Simon: 'bg-sky-600',
  Sabrina: 'bg-pink-500',
  Jonathan: 'bg-teal-600',
  Luis: 'bg-amber-600',
  Gabriela: 'bg-rose-500',
};

function getProjectBadgeStyle(color: string): string {
  const found = PROJECT_COLOR_OPTIONS.find((c) => c.value === color);
  return found ? found.light : 'bg-gray-100 text-gray-600 ring-gray-200';
}

function getProjectDot(color: string): string {
  const found = PROJECT_COLOR_OPTIONS.find((c) => c.value === color);
  return found ? found.bg : 'bg-gray-400';
}

const emptyForm: TaskFormData = {
  title: '',
  description: '',
  status: 'todo',
  assignee: '',
  project: '',
  priority: 'medium',
  due_date: '',
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function getToken(): string | null {
  return localStorage.getItem('adminToken');
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// -------------------------------------------------------------------
// Project Dropdown with inline "Create New" capability
// -------------------------------------------------------------------

function ProjectSelect({
  value,
  onChange,
  projects,
  onCreateProject,
}: {
  value: string;
  onChange: (v: string) => void;
  projects: Project[];
  onCreateProject: (name: string) => void;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (isCreating) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          placeholder="Project name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="h-8 text-[13px] flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) {
              onCreateProject(newName.trim());
              onChange(newName.trim());
              setNewName('');
              setIsCreating(false);
            }
            if (e.key === 'Escape') { setNewName(''); setIsCreating(false); }
          }}
        />
        <button
          className="p-1.5 text-[#264027] hover:bg-[#264027]/5 rounded-md transition-colors"
          onClick={() => {
            if (newName.trim()) {
              onCreateProject(newName.trim());
              onChange(newName.trim());
              setNewName('');
              setIsCreating(false);
            }
          }}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
          onClick={() => { setNewName(''); setIsCreating(false); }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <Select value={value || 'none'} onValueChange={(v) => {
      if (v === '__create__') setIsCreating(true);
      else onChange(v === 'none' ? '' : v);
    }}>
      <SelectTrigger className="h-9 text-[13px]">
        <SelectValue placeholder="No Project" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Project</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.name}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getProjectDot(p.color)}`} />
              {p.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="__create__" className="text-[#264027] font-medium">
          <span className="flex items-center gap-1.5"><Plus className="w-3 h-3" /> New Project...</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// -------------------------------------------------------------------
// Component
// -------------------------------------------------------------------

export default function TaskBoard() {
  const queryClient = useQueryClient();

  // Filters
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  // Inline add
  const [addingInColumn, setAddingInColumn] = useState<TaskStatus | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');

  // Edit dialog
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskFormData>(emptyForm);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);

  // Project management dialog
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [editingProjectColor, setEditingProjectColor] = useState('gray');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('gray');

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------

  const { data: tasks = [], isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch('/api/admin/operations/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch('/api/admin/operations/tasks/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  const getProjectStyle = (projectName: string): string => {
    const proj = projects.find((p) => p.name === projectName);
    return proj ? getProjectBadgeStyle(proj.color) : 'bg-gray-100 text-gray-600 ring-gray-200';
  };

  // ------------------------------------------------------------------
  // Project mutations
  // ------------------------------------------------------------------

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const token = getToken();
      const res = await fetch('/api/admin/operations/tasks/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      const token = getToken();
      const res = await fetch(`/api/admin/operations/tasks/projects/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingProjectId(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const res = await fetch(`/api/admin/operations/tasks/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateProject = (name: string) => {
    createProjectMutation.mutate({ name, color: 'gray' });
  };

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async (data: Partial<TaskFormData> & { title: string; status: TaskStatus }) => {
      const token = getToken();
      const res = await fetch('/api/admin/operations/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setAddingInColumn(null);
      setInlineTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TaskFormData> }) => {
      const token = getToken();
      const res = await fetch(`/api/admin/operations/tasks/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditTask(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status, position }: { id: number; status: TaskStatus; position: number }) => {
      const token = getToken();
      const res = await fetch(`/api/admin/operations/tasks/${id}/move`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, position }),
      });
      if (!res.ok) throw new Error('Failed to move task');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const res = await fetch(`/api/admin/operations/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteConfirm(null);
    },
  });

  // ------------------------------------------------------------------
  // Filtered + grouped
  // ------------------------------------------------------------------

  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee !== 'all' && t.assignee !== filterAssignee) return false;
    if (filterProject !== 'all' && t.project !== filterProject) return false;
    return true;
  });

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return (a.position ?? 0) - (b.position ?? 0);
      });

  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;

  // ------------------------------------------------------------------
  // Drag handlers
  // ------------------------------------------------------------------

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(taskId));
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverColumn(null), []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, columnStatus: TaskStatus) => {
      e.preventDefault();
      setDragOverColumn(null);
      const taskId = Number(e.dataTransfer.getData('text/plain'));
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === columnStatus) {
        setDraggedTaskId(null);
        return;
      }

      const columnTasks = tasks.filter((t) => t.status === columnStatus);
      moveMutation.mutate({ id: taskId, status: columnStatus, position: columnTasks.length });
      setDraggedTaskId(null);
    },
    [tasks, moveMutation],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  // ------------------------------------------------------------------
  // Inline add
  // ------------------------------------------------------------------

  const handleInlineAdd = (status: TaskStatus) => {
    if (!inlineTitle.trim()) return;
    createMutation.mutate({ title: inlineTitle.trim(), status, priority: 'medium' });
  };

  // ------------------------------------------------------------------
  // Edit dialog
  // ------------------------------------------------------------------

  const openEditDialog = (task: Task) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      assignee: task.assignee || '',
      project: task.project || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    });
  };

  const handleEditSave = () => {
    if (!editTask) return;
    const payload: Partial<TaskFormData> = { ...editForm };
    if (!payload.assignee) delete payload.assignee;
    if (!payload.project) delete payload.project;
    if (!payload.due_date) delete payload.due_date;
    if (!payload.description) delete payload.description;
    updateMutation.mutate({ id: editTask.id, data: payload });
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const hasFilters = filterAssignee !== 'all' || filterProject !== 'all';

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-[#fafaf9]">
          {/* Header Bar */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between h-14">
                {/* Left: Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[13px] tabular-nums">
                    <span className="text-gray-600 font-semibold">{todoCount}</span>
                    <span className="text-gray-500">to do</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-blue-600 font-semibold">{inProgressCount}</span>
                    <span className="text-gray-500">active</span>
                    <span className="text-gray-300 mx-1">/</span>
                    <span className="text-emerald-600 font-semibold">{doneCount}</span>
                    <span className="text-gray-500">done</span>
                  </div>
                  {urgentCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold ring-1 ring-red-100">
                      <AlertCircle className="w-3 h-3" />
                      {urgentCount} urgent
                    </span>
                  )}
                </div>

                {/* Right: Filters */}
                <div className="flex items-center gap-2">
                  <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="h-8 w-[130px] text-[12px] bg-white border-gray-200 shadow-none">
                      <SelectValue placeholder="All Members" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      {TEAM_MEMBERS.map((m) => (
                        <SelectItem key={m} value={m}>
                          <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${ASSIGNEE_COLORS[m] || 'bg-gray-400'}`} />
                            {m}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterProject} onValueChange={setFilterProject}>
                    <SelectTrigger className="h-8 w-[150px] text-[12px] bg-white border-gray-200 shadow-none">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getProjectDot(p.color)}`} />
                            {p.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <button
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowProjectManager(true)}
                    title="Manage Projects"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>

                  {hasFilters && (
                    <button
                      className="text-[11px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
                      onClick={() => { setFilterAssignee('all'); setFilterProject('all'); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Board Content */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-[#264027] mr-2" />
                <span className="text-[13px] text-gray-400">Loading tasks...</span>
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 max-w-md mx-auto mt-8">
                Failed to load tasks. Please try again.
              </div>
            )}

            {/* Kanban Board */}
            {!isLoading && !isError && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {COLUMNS.map((col) => {
                  const columnTasks = tasksByStatus(col.key);
                  const isOver = dragOverColumn === col.key;
                  const ColIcon = col.icon;

                  return (
                    <div
                      key={col.key}
                      className={`rounded-xl p-2.5 transition-all duration-200 ${
                        isOver
                          ? 'ring-2 ring-[#264027]/20 bg-[#264027]/[0.04]'
                          : 'bg-gray-100/70'
                      }`}
                      onDragOver={(e) => handleDragOver(e, col.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, col.key)}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1 mb-2.5">
                        <div className="flex items-center gap-2">
                          <ColIcon className={`w-4 h-4 ${col.iconColor}`} />
                          <h2 className="text-[13px] font-semibold text-gray-700">
                            {col.label}
                          </h2>
                          <span className="text-[12px] text-gray-400 tabular-nums font-medium">
                            {columnTasks.length}
                          </span>
                        </div>
                        <button
                          className="p-1 rounded-md hover:bg-white text-gray-400 hover:text-[#264027] transition-colors"
                          onClick={() => { setAddingInColumn(col.key); setInlineTitle(''); }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inline Add */}
                      {addingInColumn === col.key && (
                        <div className="mb-2">
                          <div className="rounded-lg bg-white border border-gray-200 p-3 shadow-sm">
                            <Input
                              placeholder="What needs to be done?"
                              value={inlineTitle}
                              onChange={(e) => setInlineTitle(e.target.value)}
                              className="h-8 text-[13px] border-0 shadow-none px-0 focus-visible:ring-0 placeholder:text-gray-300"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineAdd(col.key);
                                if (e.key === 'Escape') { setAddingInColumn(null); setInlineTitle(''); }
                              }}
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 text-[12px] px-3 bg-[#264027] hover:bg-[#3c5233] rounded-md"
                                onClick={() => handleInlineAdd(col.key)}
                                disabled={createMutation.isPending || !inlineTitle.trim()}
                              >
                                {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add Task'}
                              </Button>
                              <button
                                className="text-[12px] text-gray-400 hover:text-gray-600 px-2"
                                onClick={() => { setAddingInColumn(null); setInlineTitle(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Task Cards */}
                      <div className="space-y-1.5 min-h-[60px]">
                        {columnTasks.length === 0 && addingInColumn !== col.key && (
                          <div className="flex items-center justify-center py-8">
                            <p className="text-[12px] text-gray-400">No tasks</p>
                          </div>
                        )}

                        {columnTasks.map((task) => {
                          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                          const isDone = task.status === 'done';

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => openEditDialog(task)}
                              className={`group relative bg-white rounded-lg px-3 py-2.5 cursor-pointer transition-all duration-100
                                border border-gray-200
                                ${draggedTaskId === task.id ? 'opacity-30 scale-[0.97]' : 'opacity-100'}
                                hover:shadow-md hover:border-gray-300
                              `}
                            >
                              {/* Delete on hover */}
                              <button
                                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(task); }}
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                              </button>

                              {/* Priority bar */}
                              {(task.priority === 'urgent' || task.priority === 'high') && (
                                <div className={`absolute top-0 left-0 w-full h-[2px] rounded-t-lg ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-orange-400'}`} />
                              )}

                              {/* Title */}
                              <p className={`text-[13px] leading-snug pr-6 ${
                                isDone
                                  ? 'text-gray-400 line-through'
                                  : 'text-gray-900 font-medium'
                              }`}>
                                {task.title}
                              </p>

                              {/* Bottom row: assignee + project + date */}
                              <div className="flex items-center gap-2 mt-2">
                                {/* Assignee */}
                                {task.assignee && (
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold text-white shrink-0 ${ASSIGNEE_COLORS[task.assignee] || 'bg-gray-500'}`}
                                    title={task.assignee}
                                  >
                                    {getInitials(task.assignee)}
                                  </span>
                                )}

                                {/* Project */}
                                {task.project && (
                                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getProjectStyle(task.project)}`}>
                                    {task.project}
                                  </span>
                                )}

                                {/* Spacer */}
                                <span className="flex-1" />

                                {/* Due date */}
                                {task.due_date && (
                                  <span className={`text-[11px] tabular-nums ${
                                    isOverdue
                                      ? 'text-red-600 font-semibold'
                                      : 'text-gray-400'
                                  }`}>
                                    {format(new Date(task.due_date), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Edit Task - Right Sidebar Sheet                                    */}
        {/* ---------------------------------------------------------------- */}

        <Sheet open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
          <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-200 space-y-0">
              <SheetTitle className="text-[15px] font-bold text-gray-900">Edit Task</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="h-9 text-[14px] font-medium"
                  placeholder="Task title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-[13px] placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#264027]/20 focus:border-[#264027]/30 min-h-[72px] resize-y transition-colors"
                  placeholder="Add a description..."
                />
              </div>

              {/* Fields as rows - cleaner for sidebar */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as TaskStatus }))}
                    >
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((col) => {
                          const ColIcon = col.icon;
                          return (
                            <SelectItem key={col.key} value={col.key}>
                              <span className="flex items-center gap-2">
                                <ColIcon className={`w-3.5 h-3.5 ${col.iconColor}`} />
                                {col.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Priority</label>
                    <Select
                      value={editForm.priority}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, priority: v as TaskPriority }))}
                    >
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300" />Low</span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" />Medium</span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" />High</span>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" />Urgent</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Assignee</label>
                  <Select
                    value={editForm.assignee || 'none'}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, assignee: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {TEAM_MEMBERS.map((m) => (
                        <SelectItem key={m} value={m}>
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${ASSIGNEE_COLORS[m] || 'bg-gray-400'}`} />
                            {m}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Project</label>
                  <ProjectSelect
                    value={editForm.project}
                    onChange={(v) => setEditForm((f) => ({ ...f, project: v }))}
                    projects={projects}
                    onCreateProject={handleCreateProject}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                    className="h-9 text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between mt-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => { setEditTask(null); if (editTask) setDeleteConfirm(editTask); }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[13px] px-3 text-gray-500"
                  onClick={() => setEditTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-[13px] px-5 bg-[#264027] hover:bg-[#3c5233]"
                  onClick={handleEditSave}
                  disabled={updateMutation.isPending || !editForm.title.trim()}
                >
                  {updateMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ---------------------------------------------------------------- */}
        {/* Project Management Dialog                                         */}
        {/* ---------------------------------------------------------------- */}

        <Sheet open={showProjectManager} onOpenChange={setShowProjectManager}>
          <SheetContent side="right" className="w-[340px] sm:max-w-[340px] p-0 flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-200 space-y-0">
              <SheetTitle className="text-[15px] font-bold text-gray-900">Projects</SheetTitle>
              <p className="text-[12px] text-gray-500 mt-0.5">Manage project labels and colors</p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-2">
              {projects.length === 0 && (
                <p className="text-[13px] text-gray-400 text-center py-8">No projects yet</p>
              )}
              {projects.map((proj) => (
                <div key={proj.id}>
                  {editingProjectId === proj.id ? (
                    <div className="px-4 py-3 bg-gray-50 border-y border-gray-100 space-y-2.5">
                      <Input
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        className="h-8 text-[13px] bg-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingProjectName.trim()) {
                            updateProjectMutation.mutate({ id: proj.id, data: { name: editingProjectName.trim(), color: editingProjectColor } });
                          }
                          if (e.key === 'Escape') setEditingProjectId(null);
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {PROJECT_COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.value}
                              className={`w-5 h-5 rounded-full ${c.bg} transition-all ${editingProjectColor === c.value ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-110'}`}
                              onClick={() => setEditingProjectColor(c.value)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" onClick={() => setEditingProjectId(null)}>Cancel</Button>
                          <Button size="sm" className="h-7 px-3 text-[12px] bg-[#264027] hover:bg-[#3c5233]" onClick={() => {
                            if (editingProjectName.trim()) updateProjectMutation.mutate({ id: proj.id, data: { name: editingProjectName.trim(), color: editingProjectColor } });
                          }}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${getProjectDot(proj.color)}`} />
                      <span className="text-[14px] text-gray-800 flex-1 font-medium">{proj.name}</span>
                      <span className="text-[12px] text-gray-400 tabular-nums font-medium min-w-[20px] text-right">
                        {tasks.filter((t) => t.project === proj.name).length}
                      </span>
                      <button
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                        onClick={() => { setEditingProjectId(proj.id); setEditingProjectName(proj.name); setEditingProjectColor(proj.color); }}
                        title="Edit project"
                      ><Pencil className="w-3.5 h-3.5" /></button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => { if (window.confirm(`Delete "${proj.name}"? Tasks will be unassigned.`)) deleteProjectMutation.mutate(proj.id); }}
                        title="Delete project"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new project */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 mt-auto">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Add Project</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="h-9 text-[13px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      createProjectMutation.mutate({ name: newProjectName.trim(), color: newProjectColor });
                      setNewProjectName(''); setNewProjectColor('gray');
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-9 px-4 text-[12px] bg-[#264027] hover:bg-[#3c5233] font-semibold"
                  onClick={() => {
                    if (newProjectName.trim()) {
                      createProjectMutation.mutate({ name: newProjectName.trim(), color: newProjectColor });
                      setNewProjectName(''); setNewProjectColor('gray');
                    }
                  }}
                  disabled={createProjectMutation.isPending || !newProjectName.trim()}
                >Add</Button>
              </div>
              <div className="flex gap-1.5 mt-2.5">
                {PROJECT_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    className={`w-5 h-5 rounded-full ${c.bg} transition-all ${newProjectColor === c.value ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-105'}`}
                    onClick={() => setNewProjectColor(c.value)}
                  />
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ---------------------------------------------------------------- */}
        {/* Delete Confirmation                                               */}
        {/* ---------------------------------------------------------------- */}

        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-[360px] gap-0 p-0 overflow-hidden">
            <div className="px-6 pt-5 pb-4">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-[15px] font-semibold">Delete Task</DialogTitle>
                <DialogDescription className="text-[13px] text-gray-500">
                  Are you sure you want to delete &ldquo;{deleteConfirm?.title}&rdquo;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-2 sm:gap-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[13px] text-gray-500"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-[13px]"
                onClick={() => { if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id); }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1.5" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
