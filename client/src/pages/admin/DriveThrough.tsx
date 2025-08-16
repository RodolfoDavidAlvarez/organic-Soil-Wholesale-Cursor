import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Phone,
  MessageSquare,
  RefreshCw,
  Timer,
  User,
  DollarSign,
  MapPin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DriveThruOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'cancelled';
  items: Array<{
    id: string;
    product_id?: string;
    product_name: string;
    quantity: number;
    size: string;
    price_per_unit: number;
    total_price: number;
  }>;
  total_amount: number;
  subtotal: number;
  estimated_ready_time: string;
  created_at: string;
  pickup_time?: string;
  notes?: string;
  admin_notes?: string;
  vehicle_info?: string;
  order_type: string;
}

const AdminDriveThrough = () => {
  const [orders, setOrders] = useState<DriveThruOrder[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Stats
  const [stats, setStats] = useState({
    totalToday: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    avgWaitTime: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchOrders();
    // Set up real-time subscription
    const subscription = supabase
      .channel('drive-thru-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: 'order_type=eq.drive_thru'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch('/api/admin/orders?order_type=drive_thru&date_from=' + today.toISOString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const { orders } = await response.json();

      // Mock data for demonstration
      const mockOrders: DriveThruOrder[] = [
        {
          id: '1',
          order_number: 'DT-001',
          customer_name: 'John Smith',
          customer_phone: '(928) 555-0123',
          status: 'pending',
          items: [
            { id: '1', product_name: 'Premium Potting Mix', quantity: 3, size: '2 cu ft', price_per_unit: 24.99, total_price: 74.97 },
            { id: '2', product_name: 'Organic Compost', quantity: 2, size: '1 cu ft', price_per_unit: 18.99, total_price: 37.98 }
          ],
          total_amount: 113.95,
          subtotal: 112.95,
          order_type: 'drive_thru',
          estimated_ready_time: new Date(Date.now() + 15 * 60000).toISOString(),
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
          notes: 'Please load in truck bed',
          vehicle_info: 'White Ford F-150'
        },
        {
          id: '2',
          order_number: 'DT-002',
          customer_name: 'Sarah Johnson',
          customer_phone: '(928) 555-0456',
          status: 'preparing',
          items: [
            { id: '3', product_name: 'Desert Gold Mulch', quantity: 5, size: '3 cu ft', price_per_unit: 32.99, total_price: 164.95 }
          ],
          total_amount: 164.95,
          subtotal: 164.95,
          order_type: 'drive_thru',
          estimated_ready_time: new Date(Date.now() + 10 * 60000).toISOString(),
          created_at: new Date(Date.now() - 15 * 60000).toISOString(),
          vehicle_info: 'Black Chevy Silverado'
        },
        {
          id: '3',
          order_number: 'DT-003',
          customer_name: 'Mike Davis',
          customer_phone: '(928) 555-0789',
          status: 'ready',
          items: [
            { id: '4', product_name: 'Cactus Mix', quantity: 10, size: '1 cu ft', price_per_unit: 16.99, total_price: 169.90 }
          ],
          total_amount: 169.90,
          subtotal: 169.90,
          order_type: 'drive_thru',
          estimated_ready_time: new Date(Date.now() - 5 * 60000).toISOString(),
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
          vehicle_info: 'Blue Toyota Tacoma'
        }
      ];

      setOrders(orders?.length ? orders : mockOrders);
      calculateStats(orders?.length ? orders : mockOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: DriveThruOrder[]) => {
    const pending = ordersList.filter(o => o.status === 'pending').length;
    const preparing = ordersList.filter(o => o.status === 'preparing').length;
    const ready = ordersList.filter(o => o.status === 'ready').length;
    const revenue = ordersList.reduce((sum, order) => sum + order.total_amount, 0);
    
    setStats({
      totalToday: ordersList.length,
      pending,
      preparing,
      ready,
      avgWaitTime: 15, // Mock average wait time
      revenue
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: DriveThruOrder['status']) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });

      // Send SMS notification if order is ready
      if (newStatus === 'ready') {
        // TODO: Implement SMS notification
        console.log('Send SMS notification to customer');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: DriveThruOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'picked_up': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = (estimatedTime: string) => {
    const now = new Date();
    const ready = new Date(estimatedTime);
    const diff = ready.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ready now';
    
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Drive-Through Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage drive-through orders in real-time</p>
          </div>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalToday}</div>
              <p className="text-xs text-gray-500 mt-1">Today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting prep</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">Preparing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.preparing}</div>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
              <p className="text-xs text-gray-500 mt-1">For pickup</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Wait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgWaitTime}</div>
              <p className="text-xs text-gray-500 mt-1">Minutes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {order.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {order.customer_phone}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product_name} ({item.size})</span>
                          <span className="font-medium">${item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Vehicle & Notes */}
                    {(order.vehicle_info || order.notes) && (
                      <div className="space-y-2 mb-4 text-sm">
                        {order.vehicle_info && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Truck className="h-3 w-3" />
                            <span>{order.vehicle_info}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <MessageSquare className="h-3 w-3 mt-0.5" />
                            <span className="text-xs">{order.notes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Time & Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Timer className="h-3 w-3" />
                        <span>{getTimeRemaining(order.estimated_ready_time)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                          >
                            Start Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'picked_up')}
                            variant="outline"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Picked Up
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">No {activeTab === 'all' ? '' : activeTab} orders</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDriveThrough;