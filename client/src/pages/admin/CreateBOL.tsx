import { useState, useEffect } from 'react';
import { useMutation } from '@tantml:react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface BOLFormData {
  date: string;
  customerName: string;
  destinationAddress: string;
  destinationCity: string;
  destinationState: string;
  destinationZip: string;
  onsiteContactName: string;
  onsiteContactPhone: string;
  materialType: string;
  materialDescription: string;
  grossWeight: string;
  tareWeight: string;
  carrierName: string;
  driverName: string;
  truckNumber: string;
  licensePlate: string;
  trailerNumber: string;
  notes: string;
  referenceNumber: string;
}

const MATERIAL_TYPES = [
  'Orchard Compost (Pistachio Blend)',
  'Orchard Compost (Citrus Blend)',
  'Orchard Compost (Avocado Blend)',
  'Orchard Compost (Grape/Vineyard Blend)',
  'Potting Soil - Premium Mix',
  'Worm Castings',
  'Mulch - Hardwood',
  'Mulch - Cypress',
  'Custom Blend'
];

export default function CreateBOL() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<BOLFormData>({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    destinationAddress: '',
    destinationCity: '',
    destinationState: 'AZ',
    destinationZip: '',
    onsiteContactName: '',
    onsiteContactPhone: '',
    materialType: '',
    materialDescription: '',
    grossWeight: '',
    tareWeight: '',
    carrierName: 'James Bond Trucking',
    driverName: '',
    truckNumber: '',
    licensePlate: '',
    trailerNumber: '',
    notes: '',
    referenceNumber: ''
  });

  const [netWeight, setNetWeight] = useState<number>(0);
  const [netWeightTons, setNetWeightTons] = useState<string>('0.00');

  // Auto-calculate net weight
  useEffect(() => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const tare = parseFloat(formData.tareWeight) || 0;
    const net = gross - tare;
    const tons = (net / 2000).toFixed(2);

    setNetWeight(net);
    setNetWeightTons(tons);
  }, [formData.grossWeight, formData.tareWeight]);

  const createBOLMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/bols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create BOL');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'BOL Created',
        description: `BOL #${data.bolNumber} created successfully!`
      });
      navigate('/admin/operations');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName || !formData.destinationAddress || !formData.materialType) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in customer name, destination, and material type.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.grossWeight || !formData.tareWeight) {
      toast({
        title: 'Missing Weight Information',
        description: 'Please enter gross and tare weight.',
        variant: 'destructive'
      });
      return;
    }

    const bolData = {
      ...formData,
      grossWeight: parseInt(formData.grossWeight),
      tareWeight: parseInt(formData.tareWeight),
      netWeight,
      netWeightTons
    };

    createBOLMutation.mutate(bolData);
  };

  const handleChange = (field: keyof BOLFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/operations')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Operations
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New BOL / Weight Ticket</h1>
            <p className="text-sm text-gray-500 mt-1">Fill in the delivery details to generate a professional BOL</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Delivery Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                    <CardDescription>Basic delivery details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="date">Delivery Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerName">Customer Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleChange('customerName', e.target.value)}
                        placeholder="e.g., Shawn (Pistachio Project)"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="referenceNumber">Project Reference / PO Number</Label>
                      <Input
                        id="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={(e) => handleChange('referenceNumber', e.target.value)}
                        placeholder="Optional project name or PO#"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Destination */}
                <Card>
                  <CardHeader>
                    <CardTitle>Destination</CardTitle>
                    <CardDescription>Delivery location details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="destinationAddress">Street Address *</Label>
                      <Input
                        id="destinationAddress"
                        value={formData.destinationAddress}
                        onChange={(e) => handleChange('destinationAddress', e.target.value)}
                        placeholder="e.g., 6601 W Black Rd"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="destinationCity">City</Label>
                        <Input
                          id="destinationCity"
                          value={formData.destinationCity}
                          onChange={(e) => handleChange('destinationCity', e.target.value)}
                          placeholder="e.g., Willcox"
                        />
                      </div>
                      <div>
                        <Label htmlFor="destinationState">State</Label>
                        <Select value={formData.destinationState} onValueChange={(v) => handleChange('destinationState', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AZ">Arizona</SelectItem>
                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem value="NM">New Mexico</SelectItem>
                            <SelectItem value="NV">Nevada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="destinationZip">ZIP Code</Label>
                      <Input
                        id="destinationZip"
                        value={formData.destinationZip}
                        onChange={(e) => handleChange('destinationZip', e.target.value)}
                        placeholder="e.g., 85643"
                      />
                    </div>
                    <div>
                      <Label htmlFor="onsiteContactName">On-Site Contact Name</Label>
                      <Input
                        id="onsiteContactName"
                        value={formData.onsiteContactName}
                        onChange={(e) => handleChange('onsiteContactName', e.target.value)}
                        placeholder="e.g., Juan Rodriguez"
                      />
                    </div>
                    <div>
                      <Label htmlFor="onsiteContactPhone">On-Site Contact Phone</Label>
                      <Input
                        id="onsiteContactPhone"
                        type="tel"
                        value={formData.onsiteContactPhone}
                        onChange={(e) => handleChange('onsiteContactPhone', e.target.value)}
                        placeholder="e.g., 520-450-7655"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Material */}
                <Card>
                  <CardHeader>
                    <CardTitle>Material Information</CardTitle>
                    <CardDescription>What's being delivered</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="materialType">Material Type *</Label>
                      <Select value={formData.materialType} onValueChange={(v) => handleChange('materialType', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MATERIAL_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="materialDescription">Material Description</Label>
                      <Textarea
                        id="materialDescription"
                        value={formData.materialDescription}
                        onChange={(e) => handleChange('materialDescription', e.target.value)}
                        placeholder="Optional additional details about the material"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Weight Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weight Information</CardTitle>
                    <CardDescription>Enter weights in pounds (lbs)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="grossWeight">Gross Weight (lbs) *</Label>
                      <Input
                        id="grossWeight"
                        type="number"
                        value={formData.grossWeight}
                        onChange={(e) => handleChange('grossWeight', e.target.value)}
                        placeholder="e.g., 83780"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tareWeight">Tare Weight (lbs) *</Label>
                      <Input
                        id="tareWeight"
                        type="number"
                        value={formData.tareWeight}
                        onChange={(e) => handleChange('tareWeight', e.target.value)}
                        placeholder="e.g., 24820"
                        required
                      />
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Net Weight:</span>
                          <span className="font-bold text-lg">{netWeight.toLocaleString()} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Net Weight (Tons):</span>
                          <span className="font-bold text-lg">{netWeightTons} tons</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Carrier Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Carrier / Transport Information</CardTitle>
                    <CardDescription>Trucking company and vehicle details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="carrierName">Carrier Name</Label>
                      <Input
                        id="carrierName"
                        value={formData.carrierName}
                        onChange={(e) => handleChange('carrierName', e.target.value)}
                        placeholder="Default: James Bond Trucking"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driverName">Driver Name</Label>
                      <Input
                        id="driverName"
                        value={formData.driverName}
                        onChange={(e) => handleChange('driverName', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="truckNumber">Truck Number</Label>
                        <Input
                          id="truckNumber"
                          value={formData.truckNumber}
                          onChange={(e) => handleChange('truckNumber', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label htmlFor="licensePlate">License Plate</Label>
                        <Input
                          id="licensePlate"
                          value={formData.licensePlate}
                          onChange={(e) => handleChange('licensePlate', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="trailerNumber">Trailer Number</Label>
                      <Input
                        id="trailerNumber"
                        value={formData.trailerNumber}
                        onChange={(e) => handleChange('trailerNumber', e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                    <CardDescription>Optional delivery notes or special instructions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Any special instructions or notes about this delivery"
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/operations')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#264027] hover:bg-[#3c5233]"
                disabled={createBOLMutation.isPending}
              >
                {createBOLMutation.isPending ? (
                  <>Creating BOL...</>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create BOL
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
