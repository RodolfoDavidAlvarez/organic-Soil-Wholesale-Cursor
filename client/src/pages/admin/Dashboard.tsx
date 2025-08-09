import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Truck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Link } from 'wouter';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  driveThruOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  lowStockItems: number;
  activeCustomers: number;
}

const AdminDashboard = () => {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent orders
      const ordersResponse = await fetch('/api/admin/orders?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      subtitle: `${stats?.pendingOrders || 0} pending`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Drive-Through Orders',
      value: stats?.driveThruOrders || 0,
      subtitle: 'Today',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems || 0,
      subtitle: 'Need restock',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      alert: true,
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {admin?.email}. Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                    {stat.change && (
                      <div className="flex items-center mt-2">
                        {stat.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                {stat.alert && (
                  <Link href="/admin/inventory">
                    <a className="text-sm text-primary hover:underline mt-3 inline-block">
                      View inventory →
                    </a>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/products/new">
              <Button className="w-full" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button className="w-full" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View Orders
              </Button>
            </Link>
            <Link href="/admin/drive-through">
              <Button className="w-full" variant="outline">
                <Truck className="mr-2 h-4 w-4" />
                Drive-Through
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button className="w-full" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                View all →
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      order.orderType === 'quick_order' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {order.orderType === 'quick_order' ? (
                        <Truck className="h-4 w-4 text-purple-600" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.businessName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total?.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {order.status === 'completed' ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-orange-600 capitalize">{order.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent orders</p>
            )}
          </div>
        </Card>

        {/* Drive-Through Status */}
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-purple-900">Drive-Through Status</h2>
              <p className="text-sm text-purple-700 mt-1">
                {stats?.driveThruOrders || 0} orders ready for pickup
              </p>
            </div>
            <Link href="/admin/drive-through">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Truck className="mr-2 h-4 w-4" />
                Manage Pickups
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;