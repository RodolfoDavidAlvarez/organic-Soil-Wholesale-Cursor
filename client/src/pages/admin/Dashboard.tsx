import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Package,
  Users,
  Activity,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface DashboardStats {
  todayRevenue: number;
  orderStats: Array<{ status: string; count: number }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
    min_stock_level: number;
  }>;
  popularProducts: Array<{
    product_id: number;
    quantity: number;
    products: { name: string; price: number };
  }>;
  recentOrders: Array<{
    id: number;
    created_at: string;
    total: number;
    status: string;
    customers: { name: string; email: string };
  }>;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { admin, loading } = useAdminAuth();
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // Redirect operations users to their dedicated interface
  useEffect(() => {
    if (!loading && admin?.role === 'operations') {
      navigate('/admin/operations');
    }
  }, [admin, loading, navigate]);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      return response.json();
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  useEffect(() => {
    if (stats) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [stats]);

  // Show loading while checking auth or redirecting operations users
  if (loading || (admin?.role === 'operations')) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  if (isLoading) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  const orderCount = stats?.orderStats?.reduce((sum, stat) => sum + stat.count, 0) || 0;
  const pendingOrders = stats?.orderStats?.find(s => s.status === 'pending')?.count || 0;
  const lowStockCount = stats?.lowStockProducts?.length || 0;
  const recentOrders = stats?.recentOrders?.slice(0, 5) ?? [];
  const lowStockProducts = stats?.lowStockProducts?.slice(0, 5) ?? [];

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.todayRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              {pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Products need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">Across 5 categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {order.customers?.name || 'Guest'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.id} • {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent orders</p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/admin/orders')}
            >
              View All Orders
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{product.name}</p>
                      <span className="text-sm text-red-600 font-medium">
                        {product.stock} left
                      </span>
                    </div>
                    <Progress
                      value={(product.stock / product.min_stock_level) * 100}
                      className="h-2"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">All products are well stocked</p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/admin/inventory')}
            >
              Manage Inventory
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/products/new')}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs">Add Product</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Process Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/customers')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">View Customers</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/analytics')}
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
