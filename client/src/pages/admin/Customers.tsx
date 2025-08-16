import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, Phone, MapPin, ShoppingCart, Search, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  customer_profiles?: {
    id: number;
    full_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    customer_type: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string;
    is_active: boolean;
  };
}

interface Order {
  id: number;
  customer_id: string;
  total: number;
  status: string;
  order_type: string;
  created_at: string;
  order_items: any[];
}

interface NotificationPreference {
  id: number;
  customer_id: string;
  phone: string;
  email: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  order_confirmation: boolean;
  order_ready: boolean;
  marketing_emails: boolean;
  marketing_sms: boolean;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select(`
          id,
          email,
          created_at,
          customer_profiles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      // Fetch customer orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setCustomerOrders(orders || []);

      // Fetch notification preferences
      const { data: notificationPrefs, error: notifError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (!notifError && notificationPrefs) {
        setNotifications(notificationPrefs);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const updateCustomerType = async (customerId: string, newType: string) => {
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({ customer_type: newType })
        .eq('customer_id', customerId);

      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer type:', error);
    }
  };

  const toggleCustomerStatus = async (customerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('customer_profiles')
        .update({ is_active: !isActive })
        .eq('customer_id', customerId);

      if (error) throw error;
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const sendNotification = async (customerId: string, type: 'email' | 'sms', message: string) => {
    try {
      const { error } = await supabase
        .from('notification_log')
        .insert({
          customer_id: customerId,
          notification_type: type,
          template_name: 'admin_message',
          recipient: type === 'email' ? selectedCustomer?.email : notifications?.phone,
          content: message,
          status: 'pending'
        });

      if (error) throw error;
      alert(`${type.toUpperCase()} notification queued successfully!`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const profile = customer.customer_profiles;
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (profile?.phone?.includes(searchTerm) || false);
    
    const matchesType = customerTypeFilter === 'all' || profile?.customer_type === customerTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'wholesale': return 'blue';
      case 'contractor': return 'green';
      case 'member': return 'purple';
      default: return 'gray';
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.customer_profiles?.is_active !== false).length;
  const wholesaleCustomers = customers.filter(c => c.customer_profiles?.customer_type === 'wholesale').length;
  const avgOrderValue = customers.reduce((sum, c) => sum + (c.customer_profiles?.total_spent || 0), 0) / Math.max(customers.reduce((sum, c) => sum + (c.customer_profiles?.total_orders || 0), 0), 1);

  if (loading) {
    return <div className="p-6">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer accounts, orders, and communications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wholesale Customers</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{wholesaleCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customer List</TabsTrigger>
          <TabsTrigger value="analytics">Customer Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Customer Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                All registered customers and their account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Orders</th>
                      <th className="text-left p-2">Total Spent</th>
                      <th className="text-left p-2">Last Order</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const profile = customer.customer_profiles;
                      return (
                        <tr key={customer.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{profile?.full_name || 'No Name'}</div>
                              <div className="text-sm text-muted-foreground">{customer.email}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {profile?.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {profile.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className={`border-${getCustomerTypeColor(profile?.customer_type || 'regular')}-500`}>
                              {profile?.customer_type || 'regular'}
                            </Badge>
                          </td>
                          <td className="p-2 font-mono">{profile?.total_orders || 0}</td>
                          <td className="p-2 font-mono">${(profile?.total_spent || 0).toFixed(2)}</td>
                          <td className="p-2 text-sm">
                            {profile?.last_order_date 
                              ? new Date(profile.last_order_date).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="p-2">
                            <Badge variant={profile?.is_active !== false ? "success" : "destructive"}>
                              {profile?.is_active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  fetchCustomerDetails(customer.id);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Select
                                value={profile?.customer_type || 'regular'}
                                onValueChange={(value) => updateCustomerType(customer.id, value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="regular">Regular</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="contractor">Contractor</SelectItem>
                                  <SelectItem value="wholesale">Wholesale</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
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
              <CardTitle>Customer Analytics</CardTitle>
              <CardDescription>Customer insights and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Advanced customer analytics will be implemented in the next phase.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.customer_profiles?.full_name || selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders ({customerOrders.length})</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <p className="text-sm">{selectedCustomer?.customer_profiles?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedCustomer?.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedCustomer?.customer_profiles?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Customer Type</Label>
                    <p className="text-sm">{selectedCustomer?.customer_profiles?.customer_type || 'regular'}</p>
                  </div>
                  <div>
                    <Label>Total Orders</Label>
                    <p className="text-sm">{selectedCustomer?.customer_profiles?.total_orders || 0}</p>
                  </div>
                  <div>
                    <Label>Total Spent</Label>
                    <p className="text-sm">${(selectedCustomer?.customer_profiles?.total_spent || 0).toFixed(2)}</p>
                  </div>
                </div>
                {selectedCustomer?.customer_profiles?.address && (
                  <div>
                    <Label>Address</Label>
                    <p className="text-sm">
                      {selectedCustomer.customer_profiles.address}<br />
                      {selectedCustomer.customer_profiles.city}, {selectedCustomer.customer_profiles.state} {selectedCustomer.customer_profiles.zip_code}
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="orders">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${order.total.toFixed(2)}</p>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="notifications">
                <div className="space-y-4">
                  {notifications && (
                    <div className="space-y-2">
                      <Label>Notification Preferences</Label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Email Notifications: {notifications.email_notifications ? 'Yes' : 'No'}</div>
                        <div>SMS Notifications: {notifications.sms_notifications ? 'Yes' : 'No'}</div>
                        <div>Order Confirmation: {notifications.order_confirmation ? 'Yes' : 'No'}</div>
                        <div>Order Ready: {notifications.order_ready ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const message = prompt('Enter email message:');
                        if (message && selectedCustomer) {
                          sendNotification(selectedCustomer.id, 'email', message);
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const message = prompt('Enter SMS message:');
                        if (message && selectedCustomer) {
                          sendNotification(selectedCustomer.id, 'sms', message);
                        }
                      }}
                      disabled={!notifications?.phone}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send SMS
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;