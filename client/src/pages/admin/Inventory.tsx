import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, TrendingDown, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminInventory() {
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const { data: inventory, isLoading, refetch } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      return response.json();
    }
  });

  const lowStockItems = inventory?.filter((item: any) => 
    item.stock <= item.min_stock_level
  ) || [];

  const displayItems = showLowStockOnly ? lowStockItems : inventory;

  const getStockStatus = (stock: number, minStock: number) => {
    const percentage = (stock / minStock) * 100;
    if (percentage <= 25) return { color: 'destructive', label: 'Critical' };
    if (percentage <= 50) return { color: 'warning', label: 'Low' };
    return { color: 'default', label: 'Good' };
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {inventory?.filter((item: any) => item.stock === 0).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <Button
              variant={showLowStockOnly ? 'default' : 'outline'}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              {showLowStockOnly ? 'Show All' : 'Low Stock Only'}
            </Button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white shadow-sm rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock Level</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : displayItems?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  displayItems?.map((item: any) => {
                    const status = getStockStatus(item.stock, item.min_stock_level);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.sku || '-'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={item.stock === 0 ? 'text-red-600 font-semibold' : ''}>
                              {item.stock} units
                            </span>
                            <Progress
                              value={(item.stock / item.min_stock_level) * 100}
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>{item.min_stock_level} units</TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Update Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}