import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface Material {
  material: string;
  quantity: string;
  uom: string;
}

interface CODFormData {
  dateReceived: string;
  receivedFrom: string;
  salesOrder: string;
  freightOrder: string;
  vanguardWorkOrder: string;
  destructionLocation: string;
  materials: Material[];
  authorizedByName: string;
  authorizedByTitle: string;
  authorizedDate: string;
  notes: string;
  clientTag: string;
  bolId: string;
}

const DESTRUCTION_LOCATIONS = [
  'Congress, AZ Plant - 18980 Stanton Rd',
  'Phoenix, AZ Facility - 1634 N 19th Ave',
  'Other'
];

const COMMON_MATERIALS = [
  'Corn Dogs',
  'Frozen Food Products',
  'Poultry Products',
  'Organic Food Waste',
  'Green Waste',
  'Agricultural Waste',
  'Food Processing By-Products',
  'Spoiled Produce',
  'Expired Food Products',
  'Packaging Materials',
  'Wood Waste',
  'Dog Food / Pet Food',
  'Other Organic Material'
];

const UNITS_OF_MEASURE = [
  'lbs',
  'tons',
  'cubic yards',
  'pallets',
  'boxes',
  'bins',
  'bags',
  'gallons',
  'units'
];

export default function CreateCOD() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CODFormData>({
    dateReceived: new Date().toISOString().split('T')[0],
    receivedFrom: '',
    salesOrder: '',
    freightOrder: '',
    vanguardWorkOrder: '',
    destructionLocation: 'Congress, AZ Plant - 18980 Stanton Rd',
    materials: [{ material: '', quantity: '', uom: 'lbs' }],
    authorizedByName: '',
    authorizedByTitle: '',
    authorizedDate: new Date().toISOString().split('T')[0],
    notes: '',
    clientTag: '',
    bolId: ''
  });

  // Fetch recent BOLs for linking
  const { data: recentBOLs } = useQuery<Array<{ id: number; bol_number: string; customer_name: string; date: string }>>({
    queryKey: ['recent-bols-for-cod'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/bols?dateFilter=3months', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const createCODMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/cods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create COD');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'COD Created',
        description: `Certificate of Destruction #${data.cod_number} created successfully!`
      });
      navigate('/admin/operations/cods');
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
    if (!formData.receivedFrom || !formData.destructionLocation) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in "Received From" and "Destruction Location".',
        variant: 'destructive'
      });
      return;
    }

    // Filter out empty material rows and validate at least one material
    const validMaterials = formData.materials.filter(m => m.material && m.quantity);
    if (validMaterials.length === 0) {
      toast({
        title: 'Missing Materials',
        description: 'Please add at least one material with quantity.',
        variant: 'destructive'
      });
      return;
    }

    // Convert quantities to numbers
    const materialsWithNumbers = validMaterials.map(m => ({
      ...m,
      quantity: parseFloat(m.quantity) || 0
    }));

    createCODMutation.mutate({
      ...formData,
      materials: materialsWithNumbers
    });
  };

  const handleChange = (field: keyof CODFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (index: number, field: keyof Material, value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const addMaterialRow = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { material: '', quantity: '', uom: 'lbs' }]
    }));
  };

  const removeMaterialRow = (index: number) => {
    if (formData.materials.length > 1) {
      setFormData(prev => ({
        ...prev,
        materials: prev.materials.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/operations/cods')}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Create Certificate of Destruction</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Document the destruction of organic materials for recycling purposes</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4 md:space-y-6">
                {/* Receipt Information */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Receipt Information</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Basic details about the material receipt</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 px-4 pb-4">
                    <div>
                      <Label htmlFor="dateReceived" className="text-xs md:text-sm">Date Received *</Label>
                      <Input
                        id="dateReceived"
                        type="date"
                        value={formData.dateReceived}
                        onChange={(e) => handleChange('dateReceived', e.target.value)}
                        className="text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="receivedFrom" className="text-xs md:text-sm">Received From *</Label>
                      <Input
                        id="receivedFrom"
                        value={formData.receivedFrom}
                        onChange={(e) => handleChange('receivedFrom', e.target.value)}
                        placeholder="e.g., Vanguard Renewables"
                        className="text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="destructionLocation" className="text-xs md:text-sm">Destruction Location *</Label>
                      <Select value={formData.destructionLocation} onValueChange={(v) => handleChange('destructionLocation', v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTRUCTION_LOCATIONS.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Reference Numbers */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Customer Reference Numbers</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Optional tracking numbers from the customer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 px-4 pb-4">
                    <div>
                      <Label htmlFor="salesOrder" className="text-xs md:text-sm">Sales Order</Label>
                      <Input
                        id="salesOrder"
                        value={formData.salesOrder}
                        onChange={(e) => handleChange('salesOrder', e.target.value)}
                        placeholder="Customer sales order #"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="freightOrder" className="text-xs md:text-sm">Freight Order</Label>
                      <Input
                        id="freightOrder"
                        value={formData.freightOrder}
                        onChange={(e) => handleChange('freightOrder', e.target.value)}
                        placeholder="Freight/shipping order #"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vanguardWorkOrder" className="text-xs md:text-sm">Vanguard Work Order #</Label>
                      <Input
                        id="vanguardWorkOrder"
                        value={formData.vanguardWorkOrder}
                        onChange={(e) => handleChange('vanguardWorkOrder', e.target.value)}
                        placeholder="e.g., WO-2026-001"
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Associations */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Associations</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Link this COD to a client and BOL</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 px-4 pb-4">
                    <div>
                      <Label htmlFor="clientTag" className="text-xs md:text-sm">Client / Deal</Label>
                      <Select value={formData.clientTag || 'none'} onValueChange={(v) => handleChange('clientTag', v === 'none' ? '' : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="vanguard">Vanguard / Tyson</SelectItem>
                          <SelectItem value="willcox">Willcox Pistachio</SelectItem>
                          <SelectItem value="3lag">Jack / 3LAG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bolId" className="text-xs md:text-sm">Link to BOL (Optional)</Label>
                      <Select value={formData.bolId || 'none'} onValueChange={(v) => handleChange('bolId', v === 'none' ? '' : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select BOL" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No linked BOL</SelectItem>
                          {(recentBOLs || []).map(bol => (
                            <SelectItem key={bol.id} value={String(bol.id)}>
                              {bol.bol_number} — {bol.customer_name} ({bol.date})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Additional Notes</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Optional notes about this destruction certificate</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Any special notes or comments..."
                      rows={4}
                      className="text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-4 md:space-y-6">
                {/* Materials */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Materials Destroyed *</CardTitle>
                    <CardDescription className="text-xs md:text-sm">List all materials included in this destruction</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    {formData.materials.map((mat, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">Material</Label>
                          <Select
                            value={mat.material}
                            onValueChange={(v) => handleMaterialChange(index, 'material', v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_MATERIALS.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-gray-500">Quantity</Label>
                          <Input
                            type="number"
                            value={mat.quantity}
                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                            placeholder="0"
                            className="text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-gray-500">UOM</Label>
                          <Select
                            value={mat.uom}
                            onValueChange={(v) => handleMaterialChange(index, 'uom', v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS_OF_MEASURE.map(u => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.materials.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterialRow(index)}
                            className="mt-5 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMaterialRow}
                      className="w-full mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Material
                    </Button>
                  </CardContent>
                </Card>

                {/* Authorization */}
                <Card>
                  <CardHeader className="px-4 py-4">
                    <CardTitle className="text-base md:text-lg">Authorization</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Who is authorizing this destruction certificate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 px-4 pb-4">
                    <div>
                      <Label htmlFor="authorizedByName" className="text-xs md:text-sm">Authorized By (Name)</Label>
                      <Input
                        id="authorizedByName"
                        value={formData.authorizedByName}
                        onChange={(e) => handleChange('authorizedByName', e.target.value)}
                        placeholder="e.g., Rodolfo Alvarez"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authorizedByTitle" className="text-xs md:text-sm">Title</Label>
                      <Input
                        id="authorizedByTitle"
                        value={formData.authorizedByTitle}
                        onChange={(e) => handleChange('authorizedByTitle', e.target.value)}
                        placeholder="e.g., Operations Manager"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authorizedDate" className="text-xs md:text-sm">Authorization Date</Label>
                      <Input
                        id="authorizedDate"
                        type="date"
                        value={formData.authorizedDate}
                        onChange={(e) => handleChange('authorizedDate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4 md:mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/operations/cods')}
                className="w-full sm:w-auto"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#264027] hover:bg-[#3c5233] w-full sm:w-auto"
                disabled={createCODMutation.isPending}
                size="sm"
              >
                {createCODMutation.isPending ? (
                  <>Creating COD...</>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Create Certificate
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
