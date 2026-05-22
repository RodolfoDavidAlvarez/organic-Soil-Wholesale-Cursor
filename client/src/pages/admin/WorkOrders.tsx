import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Printer, Eye, Pencil, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface WorkOrder {
  id: number;
  wo_number: string;
  product_type: string;
  product_name: string;
  product_id: string;
  size_category: string;
  size_category_name: string;
  units_per_pallet: number;
  quantity: number;
  quantity_type: string;
  total_weight_lbs: number;
  status: string;
  priority: string;
  needs_transportation: boolean;
  created_at: string;
  created_by: string;
}

export default function WorkOrders() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ids: number[] }>({ show: false, ids: [] });
  const queryClient = useQueryClient();

  const { data: workOrders, isLoading, isError } = useQuery<WorkOrder[]>({
    queryKey: ['work-orders', statusFilter, dateFilter],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);

      const response = await fetch(`/api/admin/operations/work-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch work orders');
      return response.json();
    }
  });

  const filteredWorkOrders = workOrders?.filter(wo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (wo.wo_number || '').toLowerCase().includes(query) ||
      (wo.product_name || '').toLowerCase().includes(query) ||
      (wo.product_id || '').toLowerCase().includes(query) ||
      (wo.size_category_name || '').toLowerCase().includes(query)
    );
  }) || [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/work-orders/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setSelectedIds([]);
      setDeleteConfirm({ show: false, ids: [] });
    }
  });

  const handlePrint = (e: React.MouseEvent, woId: number) => {
    e.stopPropagation();
    const token = localStorage.getItem('adminToken');
    window.open(`/api/admin/operations/work-orders/${woId}/pdf?token=${token}&type=workorder`, '_blank');
  };

  const handleRowClick = (woId: number) => {
    navigate(`/admin/operations/work-orders/${woId}`);
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredWorkOrders.map(wo => wo.id) : []);
  };

  const handleDeleteClick = (e: React.MouseEvent, ids: number[]) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, ids });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteConfirm.ids);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700" },
      scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700" },
      in_progress: { label: "In Progress", className: "bg-purple-50 text-purple-700" },
      completed: { label: "Completed", className: "bg-green-50 text-green-700" }
    };
    const { label, className } = config[status] || { label: status, className: "bg-gray-100 text-gray-600" };
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${className}`}>{label}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string, className: string }> = {
      low: { label: "Low", className: "bg-gray-100 text-gray-600" },
      normal: { label: "Normal", className: "bg-gray-100 text-gray-600" },
      high: { label: "High", className: "bg-orange-50 text-orange-700" },
      urgent: { label: "Urgent", className: "bg-red-50 text-red-700" }
    };
    const { label, className } = config[priority] || { label: priority, className: "bg-gray-100 text-gray-600" };
    if (priority === 'normal') return null;
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${className}`}>{label}</span>;
  };

  // Calculate totals
  const totalWeight = filteredWorkOrders.reduce((sum, wo) => sum + (wo.total_weight_lbs || 0), 0);
  const totalPallets = filteredWorkOrders.reduce((sum, wo) =>
    wo.quantity_type === 'pallet' ? sum + wo.quantity : sum, 0
  );
  const thisWeekCount = filteredWorkOrders.filter(wo => {
    const woDate = new Date(wo.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return woDate >= weekAgo;
  }).length;

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-[#fafaf9]">
          <div className="p-3 md:p-4 max-w-[1400px] mx-auto">

            {/* Compact Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">Work Orders</h1>
                {selectedIds.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{selectedIds.length} selected</span>
                    <Button
                      onClick={(e) => handleDeleteClick(e, selectedIds)}
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
                    <span><strong className="text-gray-900">{filteredWorkOrders.length}</strong> total</span>
                    <span><strong className="text-gray-900">{thisWeekCount}</strong> this week</span>
                    <span><strong className="text-gray-900">{totalPallets}</strong> pallets</span>
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate('/admin/operations/work-orders/new')}
                size="sm"
                className="bg-[#264027] hover:bg-[#3c5233] h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Work Order
              </Button>
            </div>

            {/* Compact Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px] max-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                  <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Time</SelectItem>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="week" className="text-xs">This Week</SelectItem>
                  <SelectItem value="month" className="text-xs">This Month</SelectItem>
                  <SelectItem value="3months" className="text-xs">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : isError ? (
                <div className="p-8 text-center">
                  <ClipboardList className="w-8 h-8 text-red-300 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Failed to load work orders</p>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['work-orders'] })}
                    size="sm"
                    variant="outline"
                    className="mt-3 h-7 text-xs"
                  >
                    Try Again
                  </Button>
                </div>
              ) : filteredWorkOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No work orders found</p>
                  <Button
                    onClick={() => navigate('/admin/operations/work-orders/new')}
                    size="sm"
                    className="mt-3 bg-[#264027] hover:bg-[#3c5233] h-7 text-xs"
                  >
                    Create First Work Order
                  </Button>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200">
                      <th className="py-2 px-2 w-8">
                        <Checkbox
                          checked={selectedIds.length === filteredWorkOrders.length && filteredWorkOrders.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          className="h-3.5 w-3.5"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">WO #</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Product</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 hidden md:table-cell">Size</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Qty</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600 hidden lg:table-cell">Weight</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Status</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredWorkOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        onClick={() => handleRowClick(wo.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.includes(wo.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(wo.id)}
                            onCheckedChange={(checked) => handleSelect(wo.id, !!checked)}
                            className="h-3.5 w-3.5"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-[#264027]">
                              {wo.wo_number || '—'}
                            </span>
                            {getPriorityBadge(wo.priority)}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600 hidden sm:table-cell">
                          {format(new Date(wo.created_at), 'MM/dd/yy')}
                        </td>
                        <td className="py-2 px-3 text-gray-900 max-w-[180px] truncate">
                          {wo.product_name || 'Custom'}
                          {wo.product_id && (
                            <span className="text-gray-400 ml-1 text-[10px]">({wo.product_id})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-600 hidden md:table-cell max-w-[120px] truncate">
                          {wo.size_category_name || wo.size_category || '—'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-gray-900">
                          {wo.quantity}
                          <span className="text-gray-400 ml-0.5 text-[10px]">
                            {wo.quantity_type === 'pallet' ? 'plt' : 'unit'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-900 hidden lg:table-cell">
                          {wo.total_weight_lbs ? wo.total_weight_lbs.toLocaleString() : '—'}
                          {wo.total_weight_lbs && <span className="text-gray-400 ml-0.5">lb</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {getStatusBadge(wo.status)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handlePrint(e, wo.id)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#264027] transition-colors"
                              title="Print PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/operations/work-orders/${wo.id}`);
                              }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#264027] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/operations/work-orders/${wo.id}`);
                              }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#264027] transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, [wo.id])}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Compact Footer */}
            {filteredWorkOrders.length > 0 && (
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500 px-1">
                <span>Showing {filteredWorkOrders.length} work order{filteredWorkOrders.length !== 1 ? 's' : ''}</span>
                <span>{totalWeight.toLocaleString()} lbs total | {totalPallets} pallets</span>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-5 max-w-sm w-full mx-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Delete {deleteConfirm.ids.length === 1 ? 'Work Order' : `${deleteConfirm.ids.length} Work Orders`}?
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    This action cannot be undone. The selected work order{deleteConfirm.ids.length !== 1 ? 's' : ''} will be permanently removed.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm({ show: false, ids: [] })}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={confirmDelete}
                      disabled={deleteMutation.isPending}
                      className="h-8 text-xs"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
