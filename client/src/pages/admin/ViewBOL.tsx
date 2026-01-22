import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer, Mail, FileText, Truck, MapPin, Package, Scale, FileIcon, X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { format } from 'date-fns';

interface BOLDetails {
  id: number;
  bol_number: string;
  date: string;
  origin_location: string;
  origin_address: string;
  origin_city: string;
  origin_state: string;
  origin_zip: string;
  customer_name: string;
  destination_address: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  onsite_contact_name: string;
  onsite_contact_phone: string;
  material_type: string;
  material_description: string;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  net_weight_tons: string;
  carrier_name: string;
  driver_name: string;
  truck_number: string;
  license_plate: string;
  trailer_number: string;
  notes: string;
  reference_number: string;
  status: string;
  created_at: string;
  created_by: string;
}

export default function ViewBOL() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);

  const token = localStorage.getItem('adminToken');
  const pdfUrl = `/api/admin/operations/bols/${id}/pdf?token=${token}`;

  const { data: bol, isLoading } = useQuery<BOLDetails>({
    queryKey: ['bol', id],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/bols/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch BOL');
      return response.json();
    }
  });

  const handlePrint = () => {
    window.open(pdfUrl, '_blank');
  };

  const handleEmail = () => {
    // TODO: Implement email dialog
    console.log('Email BOL:', id);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string, label: string }> = {
      draft: { variant: "secondary", color: "text-gray-600", label: "Draft" },
      completed: { variant: "default", color: "text-green-600", label: "Ready" },
      delivered: { variant: "outline", color: "text-blue-600", label: "Delivered" }
    };
    const { variant, color, label } = config[status] || { variant: "secondary", color: "text-gray-600", label: status };
    return <Badge variant={variant} className={`${color} text-xs font-mono uppercase tracking-wider`}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">Loading BOL details...</div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  if (!bol) {
    return (
      <ProtectedAdminRoute>
        <OperationsLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-500">BOL not found</div>
          </div>
        </OperationsLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50 p-3 md:p-4">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/operations')}
                className="text-xs text-gray-600 hover:text-[#264027] h-8 -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  size="sm"
                  className="bg-[#264027] hover:bg-[#3c5233] h-8 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print
                </Button>
                <Button
                  onClick={handleEmail}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                >
                  <Mail className="w-3.5 h-3.5 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4">
            {/* PDF Preview - Left Side */}
            <div className="lg:w-1/2 xl:w-2/5">
              <div className="bg-white rounded-md border border-gray-200 overflow-hidden sticky top-4">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">{bol.bol_number}.pdf</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPdfFullscreen(true)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handlePrint}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      title="Open in new tab"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-100">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[600px] lg:h-[calc(100vh-180px)]"
                    title="BOL PDF Preview"
                  />
                </div>
              </div>
            </div>

            {/* Details - Right Side */}
            <div className="lg:w-1/2 xl:w-3/5 space-y-3">
              {/* Title Card */}
              <div className="bg-white rounded-md border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold font-mono text-[#264027]">{bol.bol_number}</h1>
                  {getStatusBadge(bol.status)}
                </div>
                <p className="text-xs text-gray-500">
                  Created {format(new Date(bol.created_at), 'MMM dd, yyyy h:mm a')}
                </p>
              </div>

              {/* BOL Details */}
              <div className="space-y-3">
            {/* Date & Reference */}
            <div className="bg-white rounded-md border border-gray-200 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Date</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {format(new Date(bol.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                {bol.reference_number && (
                  <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Reference #</div>
                    <div className="text-sm font-mono text-gray-900">{bol.reference_number}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-md border border-gray-200 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#264027]" />
                  <span className="text-xs font-semibold text-gray-700">Origin</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{bol.origin_location}</div>
                <div className="text-xs text-gray-600">{bol.origin_address}</div>
                <div className="text-xs text-gray-600">
                  {bol.origin_city}, {bol.origin_state} {bol.origin_zip}
                </div>
              </div>

              <div className="bg-white rounded-md border border-gray-200 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#6f732f]" />
                  <span className="text-xs font-semibold text-gray-700">Destination</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{bol.customer_name}</div>
                <div className="text-xs text-gray-600">{bol.destination_address}</div>
                <div className="text-xs text-gray-600">
                  {bol.destination_city}, {bol.destination_state} {bol.destination_zip}
                </div>
                {bol.onsite_contact_name && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    Contact: {bol.onsite_contact_name} {bol.onsite_contact_phone && `- ${bol.onsite_contact_phone}`}
                  </div>
                )}
              </div>
            </div>

            {/* Material */}
            <div className="bg-white rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Package className="w-3.5 h-3.5 text-[#b38a58]" />
                <span className="text-xs font-semibold text-gray-700">Material</span>
              </div>
              <div className="text-sm font-medium text-gray-900">{bol.material_type}</div>
              {bol.material_description && (
                <div className="text-xs text-gray-600 mt-1">{bol.material_description}</div>
              )}
            </div>

            {/* Weight Information - Only show if weight data exists */}
            {(bol.gross_weight > 0 || bol.tare_weight > 0) && (
              <div className="bg-gray-900 rounded-md p-3 text-white">
                <div className="flex items-center gap-1.5 mb-3">
                  <Scale className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">Weight</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/10 rounded p-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400">Gross</div>
                    <div className="text-base font-bold font-mono">{bol.gross_weight.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">lbs</div>
                  </div>
                  <div className="bg-white/10 rounded p-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400">Tare</div>
                    <div className="text-base font-bold font-mono">{bol.tare_weight.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">lbs</div>
                  </div>
                  <div className="bg-[#264027] rounded p-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-green-300">Net</div>
                    <div className="text-base font-bold font-mono">{bol.net_weight.toLocaleString()}</div>
                    <div className="text-[10px] text-green-300">{bol.net_weight_tons}t</div>
                  </div>
                </div>
              </div>
            )}

            {/* Carrier Information */}
            <div className="bg-white rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-700">Carrier & Transport</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Carrier:</span>
                  <span className="ml-1 text-gray-900">{bol.carrier_name}</span>
                </div>
                {bol.driver_name && (
                  <div>
                    <span className="text-gray-500">Driver:</span>
                    <span className="ml-1 text-gray-900">{bol.driver_name}</span>
                  </div>
                )}
                {bol.truck_number && (
                  <div>
                    <span className="text-gray-500">Truck #:</span>
                    <span className="ml-1 font-mono text-gray-900">{bol.truck_number}</span>
                  </div>
                )}
                {bol.license_plate && (
                  <div>
                    <span className="text-gray-500">Plate:</span>
                    <span className="ml-1 font-mono text-gray-900">{bol.license_plate}</span>
                  </div>
                )}
                {bol.trailer_number && (
                  <div>
                    <span className="text-gray-500">Trailer:</span>
                    <span className="ml-1 font-mono text-gray-900">{bol.trailer_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {bol.notes && (
              <div className="bg-yellow-50 rounded-md border border-yellow-200 p-3">
                <div className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wide mb-1">Notes</div>
                <div className="text-xs text-gray-700 whitespace-pre-wrap">{bol.notes}</div>
              </div>
            )}
              </div>
            </div>
          </div>

          {/* Fullscreen PDF Modal */}
          {pdfFullscreen && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
              <div className="flex items-center justify-between p-3 bg-gray-900">
                <span className="text-white text-sm font-medium">{bol.bol_number}.pdf</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrint}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-white border-gray-600 hover:bg-gray-800"
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Print
                  </Button>
                  <button
                    onClick={() => setPdfFullscreen(false)}
                    className="p-1.5 rounded hover:bg-gray-800 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <iframe
                src={pdfUrl}
                className="flex-1 w-full"
                title="BOL PDF Preview Fullscreen"
              />
            </div>
          )}
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
