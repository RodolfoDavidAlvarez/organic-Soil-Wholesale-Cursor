import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Printer, Eye, Search, Trash2, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface Material {
  material: string;
  quantity: number;
  uom: string;
}

interface COD {
  id: number;
  cod_number: string;
  date_received: string;
  received_from: string;
  sales_order: string;
  freight_order: string;
  vanguard_work_order: string;
  destruction_location: string;
  materials: Material[];
  authorized_by_name: string;
  authorized_by_title: string;
  authorized_date: string;
  notes: string;
  status: string;
  created_at: string;
  client_tag: string;
  bol_id: number;
}

export default function CODs() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('client') || 'all';
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; ids: number[] }>({ show: false, ids: [] });
  const queryClient = useQueryClient();

  const { data: cods, isLoading } = useQuery<COD[]>({
    queryKey: ['cods', statusFilter, dateFilter],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);

      const response = await fetch(`/api/admin/operations/cods?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch CODs');
      return response.json();
    }
  });

  const filteredCODs = cods?.filter(cod => {
    if (clientFilter !== 'all' && (cod.client_tag || '') !== clientFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (cod.cod_number || '').toLowerCase().includes(query) ||
      (cod.received_from || '').toLowerCase().includes(query) ||
      (cod.destruction_location || '').toLowerCase().includes(query) ||
      (cod.vanguard_work_order || '').toLowerCase().includes(query) ||
      (cod.client_tag || '').toLowerCase().includes(query)
    );
  }) || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/cods/delete', {
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
      queryClient.invalidateQueries({ queryKey: ['cods'] });
      setSelectedIds([]);
      setDeleteConfirm({ show: false, ids: [] });
    }
  });

  const handlePrint = (e: React.MouseEvent, codId: number) => {
    e.stopPropagation();
    const token = localStorage.getItem('adminToken');
    window.open(`/api/admin/operations/cods/${codId}/pdf?token=${token}`, '_blank');
  };

  const handleRowClick = (codId: number) => {
    navigate(`/admin/operations/cods/${codId}`);
  };

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredCODs.map(c => c.id) : []);
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
      draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
      completed: { label: "Completed", className: "bg-green-50 text-green-700" },
      pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700" }
    };
    const { label, className } = config[status] || { label: status, className: "bg-gray-100 text-gray-600" };
    return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${className}`}>{label}</span>;
  };

  // Calculate totals
  const totalMaterials = filteredCODs.reduce((sum, cod) => sum + (cod.materials?.length || 0), 0);
  const thisWeekCount = filteredCODs.filter(c => {
    const codDate = new Date(c.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return codDate >= weekAgo;
  }).length;

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="p-3 md:p-4 max-w-[1400px] mx-auto">

            {/* Compact Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">Certificates of Destruction</h1>
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
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                    <span><strong className="text-gray-700">{filteredCODs.length}</strong> total</span>
                    <span><strong className="text-gray-700">{thisWeekCount}</strong> this week</span>
                    <span><strong className="text-gray-700">{totalMaterials}</strong> materials</span>
                  </div>
                )}
              </div>
              <Button
                onClick={() => navigate('/admin/operations/cods/new')}
                size="sm"
                className="bg-[#264027] hover:bg-[#3c5233] h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New COD
              </Button>
            </div>

            {/* Compact Filters */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Time</SelectItem>
                  <SelectItem value="today" className="text-xs">Today</SelectItem>
                  <SelectItem value="week" className="text-xs">This Week</SelectItem>
                  <SelectItem value="month" className="text-xs">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Clients</SelectItem>
                  <SelectItem value="vanguard" className="text-xs">Vanguard</SelectItem>
                  <SelectItem value="willcox" className="text-xs">Willcox</SelectItem>
                  <SelectItem value="3lag" className="text-xs">3LAG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : filteredCODs.length === 0 ? (
                <div className="p-8 text-center">
                  <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No certificates found</p>
                  <Button
                    onClick={() => navigate('/admin/operations/cods/new')}
                    size="sm"
                    className="mt-3 bg-[#264027] hover:bg-[#3c5233] h-7 text-xs"
                  >
                    Create First COD
                  </Button>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-2 w-8">
                        <Checkbox
                          checked={selectedIds.length === filteredCODs.length && filteredCODs.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                          className="h-3.5 w-3.5"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">COD #</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">Received From</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 hidden md:table-cell">Work Order</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 hidden lg:table-cell">Location</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Materials</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">Status</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-600 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCODs.map((cod) => (
                      <tr
                        key={cod.id}
                        onClick={() => handleRowClick(cod.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.includes(cod.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(cod.id)}
                            onCheckedChange={(checked) => handleSelect(cod.id, !!checked)}
                            className="h-3.5 w-3.5"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-medium text-[#264027]">
                              {cod.cod_number || '—'}
                            </span>
                            {cod.client_tag && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                cod.client_tag === 'vanguard' ? 'bg-purple-50 text-purple-700' :
                                cod.client_tag === 'willcox' ? 'bg-orange-50 text-orange-700' :
                                cod.client_tag === '3lag' ? 'bg-indigo-50 text-indigo-700' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {cod.client_tag === 'vanguard' ? 'Vanguard' : cod.client_tag === 'willcox' ? 'Willcox' : cod.client_tag === '3lag' ? '3LAG' : cod.client_tag}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600 hidden sm:table-cell">
                          {format(new Date(cod.date_received), 'MM/dd/yy')}
                        </td>
                        <td className="py-2 px-3 text-gray-900 max-w-[150px] truncate">
                          {cod.received_from || '—'}
                        </td>
                        <td className="py-2 px-3 text-gray-600 hidden md:table-cell max-w-[120px] truncate">
                          {cod.vanguard_work_order || '—'}
                        </td>
                        <td className="py-2 px-3 text-gray-600 hidden lg:table-cell max-w-[100px] truncate">
                          {cod.destruction_location || '—'}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-gray-900">
                          {cod.materials?.length || 0}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {getStatusBadge(cod.status)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handlePrint(e, cod.id)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#264027] transition-colors"
                              title="Print PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/operations/cods/${cod.id}`);
                              }}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-[#264027] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, [cod.id])}
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
            {filteredCODs.length > 0 && (
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500 px-1">
                <span>Showing {filteredCODs.length} certificate{filteredCODs.length !== 1 ? 's' : ''}</span>
                <span>{totalMaterials} material{totalMaterials !== 1 ? 's' : ''} total</span>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-5 max-w-sm w-full mx-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Delete {deleteConfirm.ids.length === 1 ? 'Certificate' : `${deleteConfirm.ids.length} Certificates`}?
                  </h3>
                  <p className="text-xs text-gray-600 mb-4">
                    This action cannot be undone. The selected certificate{deleteConfirm.ids.length !== 1 ? 's' : ''} will be permanently removed.
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
