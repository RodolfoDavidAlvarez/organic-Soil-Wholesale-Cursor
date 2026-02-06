import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Printer, Calendar, Building2, Package, FileText, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  created_by: string;
}

export default function ViewCOD() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const codId = params.id;

  const { data: cod, isLoading, error } = useQuery<COD>({
    queryKey: ['cod', codId],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/cods/${codId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch COD');
      return response.json();
    },
    enabled: !!codId
  });

  const handlePrint = () => {
    const token = localStorage.getItem('adminToken');
    window.open(`/api/admin/operations/cods/${codId}/pdf?token=${token}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string, className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
      completed: { label: "Completed", className: "bg-green-50 text-green-700" },
      pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700" }
    };
    const { label, className } = config[status] || { label: status, className: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  if (isLoading) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500">Loading...</div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  if (error || !cod) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Failed to load certificate</p>
              <Button variant="outline" onClick={() => navigate('/admin/operations/cods')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to CODs
              </Button>
            </div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/operations/cods')}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{cod.cod_number}</h1>
                  {getStatusBadge(cod.status)}
                </div>
                <p className="text-sm text-gray-500">Certificate of Destruction</p>
              </div>
            </div>
            <Button onClick={handlePrint} className="bg-[#264027] hover:bg-[#3c5233]">
              <Printer className="w-4 h-4 mr-2" />
              Print PDF
            </Button>
          </div>

          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {/* Receipt Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#264027]" />
                  Receipt Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date Received:</span>
                  <span className="font-medium">{format(new Date(cod.date_received), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Received From:</span>
                  <span className="font-medium">{cod.received_from}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destruction Location:</span>
                  <span className="font-medium text-right max-w-[60%]">{cod.destruction_location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Reference Numbers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#264027]" />
                  Customer Reference Numbers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sales Order:</span>
                  <span className="font-medium">{cod.sales_order || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Freight Order:</span>
                  <span className="font-medium">{cod.freight_order || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vanguard Work Order:</span>
                  <span className="font-medium">{cod.vanguard_work_order || '—'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Materials */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#264027]" />
                  Materials Destroyed ({cod.materials?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Material</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600 w-24">Quantity</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600 w-24">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cod.materials?.map((material, index) => (
                        <tr key={index}>
                          <td className="py-2 px-3">{material.material}</td>
                          <td className="py-2 px-3 text-center font-mono">{material.quantity?.toLocaleString()}</td>
                          <td className="py-2 px-3 text-center">{material.uom}</td>
                        </tr>
                      ))}
                      {(!cod.materials || cod.materials.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-gray-400">No materials listed</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Authorization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-[#264027]" />
                  Authorization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Authorized By:</span>
                  <span className="font-medium">{cod.authorized_by_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Title:</span>
                  <span className="font-medium">{cod.authorized_by_title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">
                    {cod.authorized_date ? format(new Date(cod.authorized_date), 'MMMM d, yyyy') : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#264027]" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{format(new Date(cod.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created By:</span>
                  <span className="font-medium">{cod.created_by || '—'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {cod.notes && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{cod.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Certification:</strong> This certificate warrants that all organic materials listed above were presented and have been destroyed for the purpose of the recycling of organic materials into soil amendments and compost products. The destruction was performed in accordance with applicable regulations and industry standards.
            </p>
          </div>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
