import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Package, TrendingDown, TrendingUp, Search, Plus, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: number;
  product_id: number;
  location_id: number;
  size_option: string;
  quantity_available: number;
  quantity_reserved: number;
  price: number;
  unit: string;
  reorder_point: number;
  last_updated: string;
  products: {
    id: number;
    name: string;
    category: string;
  };
  locations: {
    id: number;
    name: string;
  };
}

interface InventoryAlert {
  id: number;
  product_id: number;
  location_id: number;
  size_option: string;
  alert_type: string;
  current_quantity: number;
  threshold_value: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
  products: {
    name: string;
  };
  locations: {
    name: string;
  };
}

interface Product {
  id: number;
  name: string;
  category: string;
}

interface Location {
  id: number;
  name: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchInventoryData();
    fetchAlerts();
    fetchProducts();
    fetchLocations();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (id, name, category),
          locations (id, name)
        `)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (name),
          locations (name)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const updateInventoryQuantity = async (itemId: number, newQuantity: number, reorderPoint?: number) => {
    try {
      const updateData: any = {
        quantity_available: newQuantity,
        last_updated: new Date().toISOString()
      };

      if (reorderPoint !== undefined) {
        updateData.reorder_point = reorderPoint;
      }

      const { error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;
      
      await fetchInventoryData();
      await fetchAlerts();
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ 
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.size_option.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || item.location_id.toString() === selectedLocation;
    const matchesCategory = selectedCategory === 'all' || item.products.category === selectedCategory;
    
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity_available === 0) return { status: 'out', color: 'destructive' };
    if (item.quantity_available <= (item.reorder_point * 0.2)) return { status: 'critical', color: 'destructive' };
    if (item.quantity_available <= item.reorder_point) return { status: 'low', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  const categories = [...new Set(products.map(p => p.category))];

  const totalProducts = inventory.length;
  const lowStockCount = inventory.filter(item => item.quantity_available <= item.reorder_point).length;
  const outOfStockCount = inventory.filter(item => item.quantity_available === 0).length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity_available * item.price), 0);

  if (loading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage product inventory levels and stock alerts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Inventory Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>
                      <strong>{alert.products.name}</strong> ({alert.size_option}) at {alert.locations.name}: {alert.message}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Current stock levels for all products across locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Location</th>
                      <th className="text-left p-2">Available</th>
                      <th className="text-left p-2">Reserved</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{item.products.name}</div>
                              <div className="text-sm text-muted-foreground">{item.products.category}</div>
                            </div>
                          </td>
                          <td className="p-2">{item.size_option}</td>
                          <td className="p-2">{item.locations.name}</td>
                          <td className="p-2 font-mono">{item.quantity_available}</td>
                          <td className="p-2 font-mono">{item.quantity_reserved}</td>
                          <td className="p-2 font-mono">${item.price.toFixed(2)}</td>
                          <td className="p-2">
                            <Badge variant={stockStatus.color as any}>
                              {stockStatus.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
              <CardDescription>Coming soon - inventory trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics features will be implemented in the next phase.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update quantity and reorder point for {editingItem?.products.name} ({editingItem?.size_option})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={editingItem?.quantity_available || 0}
                onChange={(e) => 
                  setEditingItem(prev => prev ? 
                    {...prev, quantity_available: parseInt(e.target.value) || 0} : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reorder" className="text-right">
                Reorder Point
              </Label>
              <Input
                id="reorder"
                type="number"
                value={editingItem?.reorder_point || 0}
                onChange={(e) => 
                  setEditingItem(prev => prev ? 
                    {...prev, reorder_point: parseInt(e.target.value) || 0} : null
                  )
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                if (editingItem) {
                  updateInventoryQuantity(
                    editingItem.id, 
                    editingItem.quantity_available,
                    editingItem.reorder_point
                  );
                }
              }}
            >
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;