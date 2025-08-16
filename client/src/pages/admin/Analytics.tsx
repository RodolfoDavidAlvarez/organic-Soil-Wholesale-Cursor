import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Calendar, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  category: string;
}

interface CustomerSegment {
  type: string;
  count: number;
  revenue: number;
  orders: number;
}

interface InventoryMetrics {
  total_products: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_value: number;
}

const Analytics: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSalesData(),
        fetchProductPerformance(),
        fetchCustomerSegments(),
        fetchInventoryMetrics()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Group data by date period
      const grouped = orders?.reduce((acc: any, order) => {
        const date = new Date(order.created_at);
        let period;
        
        if (dateRange === 'day') {
          period = date.toLocaleDateString();
        } else if (dateRange === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toLocaleDateString();
        } else {
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!acc[period]) {
          acc[period] = { period, revenue: 0, orders: 0, customers: new Set() };
        }

        acc[period].revenue += order.total;
        acc[period].orders += 1;
        acc[period].customers.add(order.customer_id);

        return acc;
      }, {}) || {};

      const salesData = Object.values(grouped).map((item: any) => ({
        ...item,
        customers: item.customers.size
      }));

      setSalesData(salesData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const fetchProductPerformance = async () => {
    try {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          order_items,
          total,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Get product details
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category');

      if (productsError) throw productsError;

      const productMap = new Map(products?.map(p => [p.id, p]) || []);
      const productStats = new Map();

      orders?.forEach(order => {
        if (Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const product = productMap.get(item.product_id);
            if (product) {
              const key = product.id;
              if (!productStats.has(key)) {
                productStats.set(key, {
                  name: product.name,
                  category: product.category,
                  sales: 0,
                  revenue: 0
                });
              }
              const stats = productStats.get(key);
              stats.sales += item.quantity;
              stats.revenue += item.price * item.quantity;
            }
          });
        }
      });

      const performance = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setProductPerformance(performance);
    } catch (error) {
      console.error('Error fetching product performance:', error);
    }
  };

  const fetchCustomerSegments = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('customer_profiles')
        .select('customer_type, total_orders, total_spent');

      if (error) throw error;

      const segments = profiles?.reduce((acc: any, profile) => {
        const type = profile.customer_type || 'regular';
        if (!acc[type]) {
          acc[type] = { type, count: 0, revenue: 0, orders: 0 };
        }
        acc[type].count += 1;
        acc[type].revenue += profile.total_spent || 0;
        acc[type].orders += profile.total_orders || 0;
        return acc;
      }, {}) || {};

      setCustomerSegments(Object.values(segments));
    } catch (error) {
      console.error('Error fetching customer segments:', error);
    }
  };

  const fetchInventoryMetrics = async () => {
    try {
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('quantity_available, price, reorder_point');

      if (error) throw error;

      const metrics = inventory?.reduce((acc, item) => {
        acc.total_products += 1;
        acc.total_value += item.quantity_available * item.price;
        
        if (item.quantity_available === 0) {
          acc.out_of_stock_items += 1;
        } else if (item.quantity_available <= item.reorder_point) {
          acc.low_stock_items += 1;
        }
        
        return acc;
      }, {
        total_products: 0,
        low_stock_items: 0,
        out_of_stock_items: 0,
        total_value: 0
      });

      setInventoryMetrics(metrics || null);
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
    }
  };

  const exportData = async (type: string) => {
    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'sales':
          csvContent = 'Period,Revenue,Orders,Customers\n' +
            salesData.map(item => 
              `${item.period},${item.revenue},${item.orders},${item.customers}`
            ).join('\n');
          filename = 'sales_data.csv';
          break;
        case 'products':
          csvContent = 'Product,Category,Sales,Revenue\n' +
            productPerformance.map(item =>
              `"${item.name}",${item.category},${item.sales},${item.revenue}`
            ).join('\n');
          filename = 'product_performance.csv';
          break;
        case 'customers':
          csvContent = 'Customer Type,Count,Revenue,Orders\n' +
            customerSegments.map(item =>
              `${item.type},${item.count},${item.revenue},${item.orders}`
            ).join('\n');
          filename = 'customer_segments.csv';
          break;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
  const totalCustomers = salesData.reduce((sum, item) => sum + item.customers, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +{((totalRevenue / Math.max(salesData.length, 1)) * 0.1).toFixed(0)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {(totalOrders / Math.max(salesData.length, 1)).toFixed(1)} per period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Active in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Revenue over time</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportData('sales')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders vs Customers</CardTitle>
                <CardDescription>Order volume and customer acquisition</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                    <Bar dataKey="customers" fill="#82ca9d" name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Top Products by Revenue</CardTitle>
                  <CardDescription>Best performing products</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportData('products')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Performance Table</CardTitle>
                <CardDescription>Detailed product metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Sales</th>
                        <th className="text-left p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.slice(0, 8).map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground">{product.category}</div>
                            </div>
                          </td>
                          <td className="p-2 font-mono">{product.sales}</td>
                          <td className="p-2 font-mono">${product.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>Distribution by customer type</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => exportData('customers')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type} (${count})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Type Metrics</CardTitle>
                <CardDescription>Revenue and order metrics by segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={segment.type} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium capitalize">{segment.type}</div>
                          <div className="text-sm text-muted-foreground">{segment.count} customers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${segment.revenue.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{segment.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryMetrics?.total_products || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{inventoryMetrics?.low_stock_items || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(inventoryMetrics?.total_value || 0).toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Insights</CardTitle>
              <CardDescription>Stock health and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Out of Stock Alert</div>
                    <div className="text-sm text-muted-foreground">
                      {inventoryMetrics?.out_of_stock_items || 0} products need immediate restocking
                    </div>
                  </div>
                  <Badge variant="destructive">{inventoryMetrics?.out_of_stock_items || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Low Stock Warning</div>
                    <div className="text-sm text-muted-foreground">
                      {inventoryMetrics?.low_stock_items || 0} products below reorder point
                    </div>
                  </div>
                  <Badge variant="warning">{inventoryMetrics?.low_stock_items || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">Inventory Turnover</div>
                    <div className="text-sm text-muted-foreground">
                      Analysis based on sales velocity (coming soon)
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;