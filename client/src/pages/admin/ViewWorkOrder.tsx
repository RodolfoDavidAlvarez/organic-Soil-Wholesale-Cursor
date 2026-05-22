import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, FileIcon, X, Maximize2, Package, Ruler, Hash, Truck, ClipboardList, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { format } from 'date-fns';

interface WorkOrderLine {
  id: number;
  product_name: string | null;
  size_category: string;
  size_category_name: string | null;
  quantity: number;
  quantity_type: string;
  total_weight_lbs: number | null;
}

interface WorkOrderDetails {
  id: number;
  wo_number: string;
  product_type: string;
  product_name: string;
  product_id: string;
  airtable_product_id: string;
  size_category: string;
  size_category_name: string;
  units_per_pallet: number;
  estimated_pallet_weight: string;
  quantity: number;
  quantity_type: string;
  ingredient_ratios: string;
  ingredients_list: string;
  mixing_guidelines: string;
  total_weight_lbs: number;
  custom_notes: string;
  needs_transportation: boolean;
  destination_address: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  preferred_delivery_date: string;
  preferred_delivery_time: string;
  linked_bol_id: number;
  status: string;
  priority: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  lines?: WorkOrderLine[];
}

export default function ViewWorkOrder() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [fullscreenPdfLoading, setFullscreenPdfLoading] = useState(true);

  const token = localStorage.getItem('adminToken');
  // PDF URLs - type: 'workorder' (default), 'label', or 'both'
  const pdfPreviewUrl = `/api/admin/operations/work-orders/${id}/pdf?token=${token}&type=workorder`;
  const pdfGuideUrl = `/api/admin/operations/work-orders/${id}/pdf?token=${token}&type=workorder`;
  const pdfLabelUrl = `/api/admin/operations/work-orders/${id}/pdf?token=${token}&type=label`;
  const pdfBothUrl = `/api/admin/operations/work-orders/${id}/pdf?token=${token}&type=both`;

  const { data: workOrder, isLoading } = useQuery<WorkOrderDetails>({
    queryKey: ['work-order', id],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/work-orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch work order');
      return response.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/work-orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      toast({
        title: 'Status Updated',
        description: 'Work order status has been updated.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handlePrintGuide = () => {
    window.open(pdfGuideUrl, '_blank');
  };

  const handlePrintLabel = () => {
    window.open(pdfLabelUrl, '_blank');
  };

  const handlePrintBoth = () => {
    window.open(pdfBothUrl, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string, label: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-700", label: "Pending" },
      scheduled: { variant: "secondary", className: "bg-blue-100 text-blue-700", label: "Scheduled" },
      in_progress: { variant: "secondary", className: "bg-purple-100 text-purple-700", label: "In Progress" },
      completed: { variant: "default", className: "bg-green-100 text-green-700", label: "Completed" }
    };
    const { className, label } = config[status] || { className: "bg-gray-100 text-gray-600", label: status };
    return <Badge className={`${className} text-xs font-medium uppercase tracking-wider`}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string, label: string }> = {
      low: { className: "bg-gray-100 text-gray-600", label: "Low" },
      normal: { className: "bg-gray-100 text-gray-600", label: "Normal" },
      high: { className: "bg-orange-100 text-orange-700", label: "High" },
      urgent: { className: "bg-red-100 text-red-700", label: "Urgent" }
    };
    const { className, label } = config[priority] || { className: "bg-gray-100 text-gray-600", label: priority };
    if (priority === 'normal') return null;
    return <Badge className={`${className} text-xs font-medium uppercase tracking-wider`}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Loading work order details...</div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  if (!workOrder) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Work order not found</div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-[#fafaf9] p-3 md:p-4">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/operations/work-orders')}
                className="text-xs text-gray-600 hover:text-[#264027] h-8 -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrintGuide}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-[#264027] text-[#264027] hover:bg-[#264027] hover:text-white"
                >
                  <ClipboardList className="w-3.5 h-3.5 mr-1" />
                  Print Guide
                </Button>
                <Button
                  onClick={handlePrintLabel}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-[#264027] text-[#264027] hover:bg-[#264027] hover:text-white"
                >
                  <Package className="w-3.5 h-3.5 mr-1" />
                  Print Label
                </Button>
                <Button
                  onClick={handlePrintBoth}
                  size="sm"
                  className="bg-[#264027] hover:bg-[#3c5233] h-8 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Both
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
            {/* PDF Preview - Left Side */}
            <div className="lg:w-1/2 xl:w-2/5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">{workOrder.wo_number}.pdf</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setFullscreenPdfLoading(true);
                        setPdfFullscreen(true);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handlePrintBoth}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      title="Print PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="bg-white relative">
                  {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-[#264027] animate-spin" />
                        <span className="text-sm text-gray-500">Loading PDF...</span>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-[600px] lg:h-[calc(100vh-180px)] bg-white"
                    title="Work Order PDF Preview"
                    onLoad={() => setPdfLoading(false)}
                  />
                </div>
              </div>
            </div>

            {/* Details - Right Side */}
            <div className="lg:w-1/2 xl:w-3/5 space-y-3">
              {/* Title Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-lg font-bold font-mono text-[#264027]">{workOrder.wo_number}</h1>
                  {getStatusBadge(workOrder.status)}
                  {getPriorityBadge(workOrder.priority)}
                </div>
                <p className="text-xs text-gray-500">
                  Created {format(new Date(workOrder.created_at), 'MMM dd, yyyy h:mm a')}
                </p>

                {/* Status Update */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500">Update Status:</span>
                    <Select
                      value={workOrder.status}
                      onValueChange={(value) => updateStatusMutation.mutate(value)}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                        <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                        <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Work Order Details */}
              <div className="space-y-3">
                {/* Line items (when multiple) or single Product / Size & Quantity */}
                {workOrder.lines && workOrder.lines.length > 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package className="w-3.5 h-3.5 text-[#264027]" />
                      <span className="text-xs font-semibold text-gray-700">Line items</span>
                    </div>
                    <div className="space-y-2">
                      {workOrder.lines.map((line, i) => (
                        <div key={line.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 text-sm">
                          <div>
                            <span className="font-medium text-gray-900">{line.product_name || 'Custom'}</span>
                            <span className="text-gray-500 ml-1">— {line.size_category_name || line.size_category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-[#264027]">{line.quantity} {line.quantity_type === 'pallet' ? 'Pallet' : 'Unit'}{line.quantity > 1 ? 's' : ''}</span>
                            {line.total_weight_lbs != null && (
                              <div className="text-xs text-gray-500">{line.total_weight_lbs.toLocaleString()} lbs</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {workOrder.total_weight_lbs > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-sm font-medium text-[#264027]">
                        Total: {workOrder.total_weight_lbs.toLocaleString()} lbs
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Package className="w-3.5 h-3.5 text-[#264027]" />
                        <span className="text-xs font-semibold text-gray-700">Product</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {workOrder.product_name || 'Custom Order'}
                      </div>
                      {workOrder.product_id && (
                        <div className="text-xs text-gray-500 font-mono">{workOrder.product_id}</div>
                      )}
                      {workOrder.ingredient_ratios && (
                        <div className="text-xs text-gray-600 mt-1">{workOrder.ingredient_ratios}</div>
                      )}
                      {workOrder.custom_notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                          {workOrder.custom_notes}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Ruler className="w-3.5 h-3.5 text-[#6f732f]" />
                          <span className="text-xs font-semibold text-gray-700">Size Category</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {workOrder.size_category_name || workOrder.size_category}
                        </div>
                        {workOrder.units_per_pallet && (
                          <div className="text-xs text-gray-500">
                            {workOrder.units_per_pallet} units/pallet
                          </div>
                        )}
                        {workOrder.estimated_pallet_weight && (
                          <div className="text-xs text-gray-500">~{workOrder.estimated_pallet_weight}</div>
                        )}
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Hash className="w-3.5 h-3.5 text-[#b38a58]" />
                          <span className="text-xs font-semibold text-gray-700">Quantity</span>
                        </div>
                        <div className="text-2xl font-bold text-[#264027]">{workOrder.quantity}</div>
                        <div className="text-xs text-gray-500">
                          {workOrder.quantity_type === 'pallet' ? 'Pallet' : 'Unit'}{workOrder.quantity > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Weight Calculation */}
                {workOrder.total_weight_lbs > 0 && (
                  <div className="bg-[#264027] rounded-xl shadow-sm p-3 text-white">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Total Estimated Weight</span>
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {workOrder.total_weight_lbs.toLocaleString()} <span className="text-sm font-normal">lbs</span>
                    </div>
                  </div>
                )}

                {/* Mixing Guidelines */}
                {workOrder.mixing_guidelines && (
                  <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-3">
                    <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-2">
                      Mixing Guidelines
                    </div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {workOrder.mixing_guidelines}
                    </pre>
                  </div>
                )}

                {/* Transportation */}
                {workOrder.needs_transportation && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700">Delivery Information</span>
                    </div>
                    <div className="text-sm text-gray-900">{workOrder.destination_address}</div>
                    <div className="text-xs text-gray-600">
                      {workOrder.destination_city}, {workOrder.destination_state} {workOrder.destination_zip}
                    </div>
                    {(workOrder.preferred_delivery_date || workOrder.preferred_delivery_time) && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {workOrder.preferred_delivery_date && format(new Date(workOrder.preferred_delivery_date), 'MMM dd, yyyy')}
                          {workOrder.preferred_delivery_time && ` - ${workOrder.preferred_delivery_time}`}
                        </span>
                      </div>
                    )}
                    {workOrder.linked_bol_id && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/operations/bols/${workOrder.linked_bol_id}`)}
                          className="h-7 text-xs"
                        >
                          View Linked BOL
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!workOrder.needs_transportation && (
                  <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Customer Pickup - No transportation required
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Created by:</span>
                      <span className="ml-1 text-gray-900">{workOrder.created_by}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <span className="ml-1 text-gray-900">
                        {format(new Date(workOrder.updated_at), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fullscreen PDF Modal */}
          {pdfFullscreen && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
              <div className="flex items-center justify-between p-3 bg-gray-900">
                <span className="text-white text-sm font-medium">{workOrder.wo_number}.pdf</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrintGuide}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-white border-gray-600 hover:bg-gray-800"
                  >
                    <ClipboardList className="w-3.5 h-3.5 mr-1" />
                    Guide
                  </Button>
                  <Button
                    onClick={handlePrintLabel}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-white border-gray-600 hover:bg-gray-800"
                  >
                    <Package className="w-3.5 h-3.5 mr-1" />
                    Label
                  </Button>
                  <Button
                    onClick={handlePrintBoth}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-white border-gray-600 hover:bg-gray-800"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Both
                  </Button>
                  <button
                    onClick={() => setPdfFullscreen(false)}
                    className="p-1.5 rounded hover:bg-gray-800 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                {fullscreenPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-10 h-10 text-[#264027] animate-spin" />
                      <span className="text-sm text-gray-600">Loading PDF...</span>
                    </div>
                  </div>
                )}
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full bg-white"
                  title="Work Order PDF Preview Fullscreen"
                  onLoad={() => setFullscreenPdfLoading(false)}
                />
              </div>
            </div>
          )}
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
