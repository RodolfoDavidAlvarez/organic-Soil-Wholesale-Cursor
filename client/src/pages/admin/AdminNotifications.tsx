import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Mail, 
  User, 
  Bell, 
  Save,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminNotification {
  id: number;
  email: string;
  name: string;
  role: string;
  notify_new_orders: boolean;
  notify_arrivals: boolean;
  notify_trivia_leads: boolean;
  notify_contact_forms: boolean;
  notify_quote_requests: boolean;
  notify_special_requests: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminNotifications() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // Form state for new admin
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    name: '',
    role: 'admin',
    notify_new_orders: true,
    notify_arrivals: true,
    notify_trivia_leads: true,
    notify_contact_forms: true,
    notify_quote_requests: true,
    notify_special_requests: true,
    active: true
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdmins();
    }
  }, [isAuthenticated]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch admins');

      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin');
      }

      const data = await response.json();
      setAdmins([...admins, data]);
      setShowAddForm(false);
      setNewAdmin({
        email: '',
        name: '',
        role: 'admin',
        notify_new_orders: true,
        notify_arrivals: true,
        notify_trivia_leads: true,
        notify_contact_forms: true,
        notify_quote_requests: true,
        notify_special_requests: true,
        active: true
      });

      toast({
        title: 'Success',
        description: 'Admin notification created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create admin',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAdmin = async (id: number, updates: Partial<AdminNotification>) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update admin');
      }

      const data = await response.json();
      setAdmins(admins.map(a => a.id === id ? data : a));
      setEditingId(null);

      toast({
        title: 'Success',
        description: 'Admin notification updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update admin',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle admin status');
      }

      const data = await response.json();
      setAdmins(admins.map(a => a.id === id ? data : a));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle admin status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete admin');
      }

      setAdmins(admins.filter(a => a.id !== id));

      toast({
        title: 'Success',
        description: 'Admin notification deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete admin',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const notificationTypes = [
    { key: 'notify_new_orders', label: 'New Orders', icon: '📦' },
    { key: 'notify_arrivals', label: 'Customer Arrivals', icon: '🚗' },
    { key: 'notify_trivia_leads', label: 'Trivia Leads', icon: '🎯' },
    { key: 'notify_contact_forms', label: 'Contact Forms', icon: '📧' },
    { key: 'notify_quote_requests', label: 'Quote Requests', icon: '💰' },
    { key: 'notify_special_requests', label: 'Special Requests', icon: '⭐' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Notifications</h1>
          <p className="text-gray-600 mt-1">Manage who receives email notifications</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700"
          disabled={showAddForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Add New Admin Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Admin Name"
                />
              </div>
            </div>

            <div className="mb-4">
              <Label>Notification Preferences</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {notificationTypes.map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      id={`new-${key}`}
                      checked={newAdmin[key as keyof typeof newAdmin] as boolean}
                      onCheckedChange={(checked) => 
                        setNewAdmin({ ...newAdmin, [key]: checked })
                      }
                    />
                    <Label htmlFor={`new-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAdmin({
                    email: '',
                    name: '',
                    role: 'admin',
                    notify_new_orders: true,
                    notify_arrivals: true,
                    notify_trivia_leads: true,
                    notify_contact_forms: true,
                    notify_quote_requests: true,
                    notify_special_requests: true,
                    active: true
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCreateAdmin}
                disabled={!newAdmin.email || !newAdmin.name}
              >
                <Save className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card key={admin.id} className={!admin.active ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{admin.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{admin.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={admin.active ? 'default' : 'secondary'}>
                        {admin.active ? 'Active' : 'Inactive'}
                      </Badge>
                      {admin.role === 'primary_admin' && (
                        <Badge variant="outline">Primary Admin</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(editingId === admin.id ? null : admin.id)}
                  >
                    {editingId === admin.id ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(admin.id)}
                  >
                    {admin.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  {admin.role !== 'primary_admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteAdmin(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {editingId === admin.id ? (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {notificationTypes.map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={`${admin.id}-${key}`}
                          checked={admin[key as keyof AdminNotification] as boolean}
                          onCheckedChange={(checked) => 
                            handleUpdateAdmin(admin.id, { [key]: checked })
                          }
                        />
                        <Label htmlFor={`${admin.id}-${key}`} className="text-sm cursor-pointer">
                          <span className="mr-1">{icon}</span>
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Bell className="h-4 w-4 mr-1" />
                    Receives notifications for:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {notificationTypes
                      .filter(({ key }) => admin[key as keyof AdminNotification])
                      .map(({ label, icon }) => (
                        <Badge key={label} variant="secondary">
                          <span className="mr-1">{icon}</span>
                          {label}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {admins.length === 0 && !showAddForm && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Admins Configured</h3>
            <p className="text-gray-600 mb-4">Add admins to receive email notifications</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Admin
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}