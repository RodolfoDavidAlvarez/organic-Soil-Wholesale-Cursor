import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Mail, User, Phone, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface NotificationRecipient {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  notify_by_email?: boolean;
  notify_by_phone?: boolean;
  created_at: string;
}

export default function OperationsSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    phone: '',
    notify_by_email: true,
    notify_by_phone: false,
  });

  const { data: recipients = [], isLoading } = useQuery<NotificationRecipient[]>({
    queryKey: ['ops-settings', 'work-order-notifications'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/settings/work-order-notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch recipients');
      return response.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (body: {
      name: string;
      email: string;
      phone: string;
      notify_by_email?: boolean;
      notify_by_phone?: boolean;
    }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/settings/work-order-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to add recipient');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-settings', 'work-order-notifications'] });
      setShowAddForm(false);
      setNewRecipient({ name: '', email: '', phone: '', notify_by_email: true, notify_by_phone: false });
      toast({ title: 'Recipient added', description: 'They will be notified when a new work order is created.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { notify_by_email?: boolean; notify_by_phone?: boolean } }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/settings/work-order-notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update recipient');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-settings', 'work-order-notifications'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/settings/work-order-notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to remove recipient');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ops-settings', 'work-order-notifications'] });
      toast({ title: 'Recipient removed', description: 'They will no longer receive work order notifications.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAdd = () => {
    const name = newRecipient.name.trim();
    const email = newRecipient.email.trim();
    if (!name) {
      toast({ title: 'Name required', description: 'Please enter a name.', variant: 'destructive' });
      return;
    }
    if (!email) {
      toast({ title: 'Email required', description: 'Please enter an email.', variant: 'destructive' });
      return;
    }
    const phone = newRecipient.phone.trim() || '';
    addMutation.mutate({
      name,
      email,
      phone,
      notify_by_email: newRecipient.notify_by_email,
      notify_by_phone: phone ? newRecipient.notify_by_phone : false,
    });
  };

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">Operations Settings</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage who gets notified for work orders and other operations.</p>
            </div>

            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#264027]" />
                  <CardTitle className="text-lg text-[#264027]">Notify when a work order is added</CardTitle>
                </div>
                <CardDescription>
                  These people will be notified (e.g. by email) when someone creates a new work order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading recipients...</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {recipients.length === 0 && !showAddForm && (
                        <li className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                          No recipients yet. Click &quot;Add recipient&quot; to add someone.
                        </li>
                      )}
                      {recipients.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-[#264027]/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-[#264027]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{r.name}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {r.email}
                              </p>
                              {r.phone && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  {r.phone}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                {r.email && (
                                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                                    <Checkbox
                                      checked={r.notify_by_email !== false}
                                      onCheckedChange={(checked) =>
                                        updateMutation.mutate({
                                          id: r.id,
                                          updates: { notify_by_email: checked === true },
                                        })
                                      }
                                      disabled={updateMutation.isPending}
                                    />
                                    <span>Notify by email</span>
                                  </label>
                                )}
                                {r.phone && (
                                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                                    <Checkbox
                                      checked={r.notify_by_phone === true}
                                      onCheckedChange={(checked) =>
                                        updateMutation.mutate({
                                          id: r.id,
                                          updates: { notify_by_phone: checked === true },
                                        })
                                      }
                                      disabled={updateMutation.isPending}
                                    />
                                    <span>Notify by phone</span>
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 self-end sm:self-center"
                            onClick={() => deleteMutation.mutate(r.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>

                    {showAddForm ? (
                      <div className="p-4 border border-[#264027]/20 rounded-lg bg-[#264027]/5 space-y-3">
                        <p className="text-sm font-medium text-gray-700">New recipient</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="new-name" className="text-xs">Name</Label>
                            <Input
                              id="new-name"
                              placeholder="e.g. Jane Smith"
                              value={newRecipient.name}
                              onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="new-email" className="text-xs">Email</Label>
                            <Input
                              id="new-email"
                              type="email"
                              placeholder="jane@example.com"
                              value={newRecipient.email}
                              onChange={(e) => setNewRecipient((prev) => ({ ...prev, email: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="new-phone" className="text-xs">Phone (optional)</Label>
                            <Input
                              id="new-phone"
                              type="tel"
                              placeholder="(555) 123-4567"
                              value={newRecipient.phone}
                              onChange={(e) => setNewRecipient((prev) => ({ ...prev, phone: e.target.value }))}
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-1">
                          {newRecipient.email.trim() && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                              <Checkbox
                                checked={newRecipient.notify_by_email}
                                onCheckedChange={(checked) =>
                                  setNewRecipient((prev) => ({ ...prev, notify_by_email: checked === true }))
                                }
                              />
                              <span>Notify by email</span>
                            </label>
                          )}
                          {newRecipient.phone.trim() && (
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                              <Checkbox
                                checked={newRecipient.notify_by_phone}
                                onCheckedChange={(checked) =>
                                  setNewRecipient((prev) => ({ ...prev, notify_by_phone: checked === true }))
                                }
                              />
                              <span>Notify by phone</span>
                            </label>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#264027] hover:bg-[#3c5233]"
                            onClick={handleAdd}
                            disabled={addMutation.isPending}
                          >
                            {addMutation.isPending ? 'Adding...' : 'Add'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddForm(false);
                              setNewRecipient({ name: '', email: '', phone: '', notify_by_email: true, notify_by_phone: false });
                            }}
                            disabled={addMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#264027] text-[#264027] hover:bg-[#264027] hover:text-white"
                        onClick={() => setShowAddForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add recipient
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
