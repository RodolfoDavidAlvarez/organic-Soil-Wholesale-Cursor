import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Search, User, NotebookPen } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RepresentativeSummary {
  id: number;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
}

interface RepresentativeContactRecord {
  id: number;
  representative_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  message?: string;
  status: string;
  notes?: string;
  created_at: string;
  representative?: RepresentativeSummary | null;
}

const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'archived'] as const;

export default function AdminRepresentativeContacts() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'super_admin';
  const [statusFilter, setStatusFilter] = useState<'all' | typeof statusOptions[number]>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RepresentativeContactRecord | null>(null);
  const [detailStatus, setDetailStatus] = useState<typeof statusOptions[number]>('new');
  const [detailNotes, setDetailNotes] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (selectedContact) {
      setDetailStatus((selectedContact.status as typeof statusOptions[number]) || 'new');
      setDetailNotes(selectedContact.notes || '');
    }
  }, [selectedContact]);

  const {
    data: contacts = [],
    isLoading,
  } = useQuery<RepresentativeContactRecord[]>({
    queryKey: ['adminRepresentativeContacts', statusFilter, searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      const response = await fetch(
        `/api/admin/representative-contacts${params.size ? `?${params.toString()}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load contact submissions');
      }

      return response.json();
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { status?: string; notes?: string };
    }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/representative-contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Unable to update contact');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRepresentativeContacts'] });
      toast({
        title: 'Contact updated',
        description: 'Changes saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInlineStatusChange = (contactId: number, status: string) => {
    updateContactMutation.mutate({ id: contactId, data: { status } });
  };

  const handleOpenContact = (contact: RepresentativeContactRecord) => {
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };

  const handleSaveDetail = async () => {
    if (!selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data: {
          status: detailStatus,
          notes: detailNotes,
        },
      });
      setIsDialogOpen(false);
    } catch {
      // handled in mutation onError
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-600 hover:bg-green-600">Converted</Badge>;
      case 'qualified':
        return <Badge className="bg-blue-600 hover:bg-blue-600">Qualified</Badge>;
      case 'contacted':
        return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">Contacted</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">New</Badge>;
    }
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">My CRM Contacts</h1>
              <p className="text-muted-foreground">
                View and manage contact submissions from your contact landing page.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Contact Submissions</CardTitle>
                  <CardDescription>
                    {contacts.length} contact{contacts.length === 1 ? '' : 's'} tracked
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="w-full md:w-60">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as 'all' | typeof statusOptions[number])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center text-muted-foreground">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No contacts match the filters.'
                    : 'No contact submissions yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Contact</TableHead>
                        {isSuperAdmin && <TableHead>Representative</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <div className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </div>
                            {contact.company_name && (
                              <div className="text-sm text-muted-foreground">
                                {contact.company_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="hover:underline"
                                >
                                  {contact.email}
                                </a>
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5" />
                                  <a href={`tel:${contact.phone}`} className="hover:underline">
                                    {contact.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              {contact.representative ? (
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" />
                                    <span>{contact.representative.name}</span>
                                  </div>
                                  {contact.representative.slug && (
                                    <a
                                      href={`/rep/${contact.representative.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-green-600 hover:underline"
                                    >
                                      /rep/{contact.representative.slug}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unknown</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {renderStatusBadge(contact.status)}
                              <Select
                                value={contact.status}
                                onValueChange={(value) => handleInlineStatusChange(contact.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(contact.created_at).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenContact(contact)}>
                              <NotebookPen className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
              <DialogDescription>
                View submission details and update CRM status or notes.
              </DialogDescription>
            </DialogHeader>

            {selectedContact && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prospect</p>
                    <p className="text-lg font-semibold">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </p>
                    {selectedContact.company_name && (
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.company_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Representative</p>
                    <p className="text-lg font-semibold">
                      {selectedContact.representative?.name || 'Unknown'}
                    </p>
                    {selectedContact.representative?.slug && (
                      <a
                        href={`/rep/${selectedContact.representative.slug}`}
                        className="text-sm text-green-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View landing page
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Message / Notes</p>
                  <div className="rounded-md border bg-muted/30 p-4 text-sm">
                    {selectedContact.message?.trim() ? selectedContact.message : 'No notes provided.'}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="detailStatus">Status</Label>
                    <Select value={detailStatus} onValueChange={(value) => setDetailStatus(value as typeof statusOptions[number])}>
                      <SelectTrigger id="detailStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detailNotes">Internal Notes</Label>
                    <Textarea
                      id="detailNotes"
                      value={detailNotes}
                      onChange={(e) => setDetailNotes(e.target.value)}
                      placeholder="Log follow-ups, handoff details, etc."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDetail} disabled={updateContactMutation.isPending}>
                    {updateContactMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
