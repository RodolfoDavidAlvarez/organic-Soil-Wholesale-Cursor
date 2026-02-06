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
import { Mail, Phone, Search, User, NotebookPen, CreditCard, ExternalLink, X, ZoomIn, Building2, Leaf, GraduationCap, MapPin, Tractor, Truck, Trees, Factory, Shield, Heart, BookOpen, Calendar, Copy, Check } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RepresentativeSummary {
  id: number;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
}

interface ContactMetadata {
  title?: string;
  address?: string;
  website?: string;
  business_card_image_url?: string;
  scanned_at?: string;
  company_research?: string;
  ai_generated_email?: {
    subject?: string;
    body?: string;
  };
  voice_notes?: string;
}

interface RepresentativeContactRecord {
  id: number;
  representative_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  title?: string;
  website?: string;
  message?: string;
  status: string;
  notes?: string;
  source?: string;
  segment?: string;
  lead_source?: string;
  partner_owner?: string;
  context_notes?: string;
  company_context?: string;
  first_email_sent_at?: string;
  first_email_subject?: string;
  first_email_body?: string;
  metadata?: ContactMetadata;
  created_at: string;
  representative?: RepresentativeSummary | null;
}

// Segment configuration with colors and icons
const SEGMENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Building2 }> = {
  operator: { label: 'Operator', color: 'bg-amber-500', icon: Factory },
  farmer_vineyard: { label: 'Vineyard', color: 'bg-purple-500', icon: MapPin },
  farmer_orchard: { label: 'Orchard', color: 'bg-orange-500', icon: Trees },
  farmer_general: { label: 'Farmer', color: 'bg-green-600', icon: Tractor },
  waste_hauler: { label: 'Hauler', color: 'bg-slate-600', icon: Truck },
  landscaper: { label: 'Landscaper', color: 'bg-emerald-500', icon: Trees },
  municipal: { label: 'Municipal', color: 'bg-blue-500', icon: Building2 },
  equipment: { label: 'Equipment', color: 'bg-slate-500', icon: Factory },
  policy: { label: 'Policy', color: 'bg-indigo-500', icon: Shield },
  esg: { label: 'ESG', color: 'bg-teal-500', icon: Heart },
  education: { label: 'Education', color: 'bg-cyan-500', icon: BookOpen },
  other: { label: 'Other', color: 'bg-gray-500', icon: Building2 },
};

// Partner owner configuration
const PARTNER_CONFIG: Record<string, { label: string; color: string; icon: typeof Leaf }> = {
  ssw: { label: 'SSW', color: 'bg-emerald-600', icon: Leaf },
  ufe: { label: 'UFE', color: 'bg-blue-600', icon: GraduationCap },
  both: { label: 'Both', color: 'bg-purple-600', icon: Building2 },
};

// Lead source options
const LEAD_SOURCE_OPTIONS = [
  'USCC 2026',
  'Trade Show',
  'AZCC',
  'Referral',
  'Website',
  'Conference',
  'Cold Outreach',
  'Partner Intro',
  'Other',
];

const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'archived'] as const;

// Copy CRM Link Button Component
function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const crmLink = `${window.location.origin}/rep/${slug}`;
    try {
      await navigator.clipboard.writeText(crmLink);
      setCopied(true);
      toast({
        title: 'CRM link copied!',
        description: 'Your contact landing page link is ready to share.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy My CRM Link
        </>
      )}
    </Button>
  );
}

export default function AdminRepresentativeContacts() {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'super_admin';
  const [statusFilter, setStatusFilter] = useState<'all' | typeof statusOptions[number]>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RepresentativeContactRecord | null>(null);
  const [detailStatus, setDetailStatus] = useState<typeof statusOptions[number]>('new');
  const [detailNotes, setDetailNotes] = useState('');
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

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
    queryKey: ['adminRepresentativeContacts', statusFilter, segmentFilter, ownerFilter, sourceFilter, searchTerm],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (segmentFilter !== 'all') {
        params.append('segment', segmentFilter);
      }
      if (ownerFilter !== 'all') {
        params.append('partner_owner', ownerFilter);
      }
      if (sourceFilter !== 'all') {
        params.append('lead_source', sourceFilter);
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/representative-contacts/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contacts');
      }

      return response.json();
    },
    onSuccess: (_, deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['adminRepresentativeContacts'] });
      setSelectedIds(new Set());
      toast({
        title: 'Contacts deleted',
        description: `Successfully deleted ${deletedIds.length} contact(s)`,
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

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} contact(s)? This cannot be undone.`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

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

  const handleOpenSidePanel = (contact: RepresentativeContactRecord) => {
    setSelectedContact(contact);
    setDetailStatus((contact.status as typeof statusOptions[number]) || 'new');
    setDetailNotes(contact.notes || '');
    setIsSidePanelOpen(true);
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
      setIsSidePanelOpen(false);
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

  const renderSegmentBadge = (segment?: string) => {
    if (!segment) return null;
    const config = SEGMENT_CONFIG[segment] || SEGMENT_CONFIG.other;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderOwnerBadge = (owner?: string) => {
    if (!owner) return null;
    const config = PARTNER_CONFIG[owner] || PARTNER_CONFIG.both;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderSourceBadge = (source?: string) => {
    if (!source) return null;
    return (
      <Badge variant="outline" className="text-xs">
        <Calendar className="h-3 w-3 mr-1" />
        {source}
      </Badge>
    );
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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Contact Submissions</CardTitle>
                    <CardDescription>
                      {contacts.length} contact{contacts.length === 1 ? '' : 's'} tracked
                      {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {admin?.slug && <CopyLinkButton slug={admin.slug} />}
                    {selectedIds.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={bulkDeleteMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Delete {selectedIds.size}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="w-full sm:w-36">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setStatusFilter(value as 'all' | typeof statusOptions[number])
                      }
                    >
                      <SelectTrigger className="h-9">
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
                  <div className="w-full sm:w-36">
                    <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Segments</SelectItem>
                        {Object.entries(SEGMENT_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-36">
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Owners</SelectItem>
                        {Object.entries(PARTNER_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-40">
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="How did you meet?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {LEAD_SOURCE_OPTIONS.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, phone..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="pl-9 h-9"
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
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-4 rounded-xl border bg-card shadow-sm active:scale-[0.99] transition-transform ${selectedIds.has(contact.id) ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleOpenSidePanel(contact)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div onClick={(e) => e.stopPropagation()} className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => handleSelectOne(contact.id)}
                              className="h-5 w-5 rounded border-gray-300"
                            />
                          </div>
                          
                          {/* Card Image Thumbnail */}
                          {contact.metadata?.business_card_image_url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedImageUrl(contact.metadata!.business_card_image_url!);
                              }}
                              className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border bg-muted"
                            >
                              <img
                                src={contact.metadata.business_card_image_url}
                                alt="Card"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          )}
                          
                          {/* Contact Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-base truncate">
                                  {contact.first_name} {contact.last_name}
                                </p>
                                {contact.company_name && (
                                  <p className="text-sm text-muted-foreground truncate">
                                    {contact.company_name}
                                  </p>
                                )}
                              </div>
                              {renderStatusBadge(contact.status)}
                            </div>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {renderOwnerBadge(contact.partner_owner)}
                              {renderSegmentBadge(contact.segment)}
                            </div>
                            
                            {/* Contact Actions */}
                            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="flex-1 flex items-center justify-center gap-2 h-11 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                                >
                                  <Mail className="h-4 w-4" />
                                  Email
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="flex-1 flex items-center justify-center gap-2 h-11 px-3 rounded-lg border text-sm font-medium"
                                >
                                  <Phone className="h-4 w-4" />
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                          <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                          {renderSourceBadge(contact.lead_source)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === contacts.length && contacts.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Prospect</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Contact</TableHead>
                        {isSuperAdmin && <TableHead>Representative</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => (
                        <TableRow
                          key={contact.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(contact.id) ? 'bg-muted/30' : ''}`}
                          onClick={() => handleOpenSidePanel(contact)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => handleSelectOne(contact.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              {contact.metadata?.business_card_image_url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedImageUrl(contact.metadata!.business_card_image_url!);
                                  }}
                                  className="flex-shrink-0 w-12 h-8 rounded overflow-hidden border bg-muted hover:ring-2 hover:ring-primary/50 transition-all cursor-zoom-in group relative"
                                  title="Click to expand"
                                >
                                  <img
                                    src={contact.metadata.business_card_image_url}
                                    alt="Business card"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </button>
                              )}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {contact.first_name} {contact.last_name}
                                  {contact.source === 'business_card_scan' && (
                                    <Badge variant="secondary" className="text-xs">
                                      <CreditCard className="h-3 w-3 mr-1" />
                                      Scanned
                                    </Badge>
                                  )}
                                </div>
                                {contact.company_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {contact.company_name}
                                  </div>
                                )}
                                {contact.metadata?.title && (
                                  <div className="text-xs text-muted-foreground">
                                    {contact.metadata.title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {renderOwnerBadge(contact.partner_owner)}
                              {renderSegmentBadge(contact.segment)}
                              {renderSourceBadge(contact.lead_source)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.email}
                                </a>
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5" />
                                  <a href={`tel:${contact.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
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
                                      onClick={(e) => e.stopPropagation()}
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
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-2">
                              {renderStatusBadge(contact.status)}
                              <Select
                                value={contact.status}
                                onValueChange={(value) => handleInlineStatusChange(contact.id, value)}
                              >
                                <SelectTrigger className="h-8">
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
                              {new Date(contact.created_at).toLocaleDateString()}
                              <div className="text-xs">
                                {new Date(contact.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm" onClick={() => handleOpenSidePanel(contact)}>
                              <NotebookPen className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </>
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
                {/* Business Card Image */}
                {selectedContact.metadata?.business_card_image_url && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Scanned Business Card
                      </p>
                      <button
                        onClick={() => setExpandedImageUrl(selectedContact.metadata!.business_card_image_url!)}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Full Size <ZoomIn className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => setExpandedImageUrl(selectedContact.metadata!.business_card_image_url!)}
                      className="rounded-lg border overflow-hidden bg-muted/30 w-full cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <img
                        src={selectedContact.metadata.business_card_image_url}
                        alt="Business card"
                        className="w-full max-h-48 object-contain"
                      />
                    </button>
                  </div>
                )}

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
                    {selectedContact.metadata?.title && (
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.metadata.title}
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

                {/* Additional metadata from business card */}
                {(selectedContact.metadata?.address || selectedContact.metadata?.website) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedContact.metadata.address && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm">{selectedContact.metadata.address}</p>
                      </div>
                    )}
                    {selectedContact.metadata.website && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a
                          href={selectedContact.metadata.website.startsWith('http') ? selectedContact.metadata.website : `https://${selectedContact.metadata.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {selectedContact.metadata.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}

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

        {/* Image Lightbox */}
        {expandedImageUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImageUrl(null)}
          >
            <button
              onClick={() => setExpandedImageUrl(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={expandedImageUrl}
              alt="Business card expanded"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Side Panel for Contact Details */}
        {isSidePanelOpen && selectedContact && (
          <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsSidePanelOpen(false)}
            />
            {/* Panel */}
            <div className="relative w-full max-w-xl bg-background shadow-xl overflow-y-auto animate-in slide-in-from-right">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.company_name || 'No company'}
                    {selectedContact.metadata?.title && ` • ${selectedContact.metadata.title}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSidePanelOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-4 space-y-6">
                {/* Tags Section */}
                <div className="flex flex-wrap gap-2">
                  {renderOwnerBadge(selectedContact.partner_owner)}
                  {renderSegmentBadge(selectedContact.segment)}
                  {renderSourceBadge(selectedContact.lead_source)}
                  {renderStatusBadge(selectedContact.status)}
                </div>

                {/* Business Card Image */}
                {selectedContact.metadata?.business_card_image_url && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Business Card
                    </h3>
                    <button
                      onClick={() => setExpandedImageUrl(selectedContact.metadata!.business_card_image_url!)}
                      className="rounded-lg border overflow-hidden bg-muted/30 w-full cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all"
                    >
                      <img
                        src={selectedContact.metadata.business_card_image_url}
                        alt="Business card"
                        className="w-full max-h-48 object-contain"
                      />
                    </button>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Contact Information</h3>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedContact.email}`} className="hover:underline">
                        {selectedContact.email}
                      </a>
                    </div>
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedContact.phone}`} className="hover:underline">
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                    {(selectedContact.website || selectedContact.metadata?.website) && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={(selectedContact.website || selectedContact.metadata?.website || '').startsWith('http')
                            ? (selectedContact.website || selectedContact.metadata?.website)
                            : `https://${selectedContact.website || selectedContact.metadata?.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600"
                        >
                          {selectedContact.website || selectedContact.metadata?.website}
                        </a>
                      </div>
                    )}
                    {selectedContact.metadata?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedContact.metadata.address}</span>
                      </div>
                    )}
                    {(selectedContact.title || selectedContact.metadata?.title) && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedContact.title || selectedContact.metadata?.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Company Research */}
                {selectedContact.company_context && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      AI Company Research
                    </h3>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                      {selectedContact.company_context}
                    </div>
                  </div>
                )}

                {/* Voice Notes / Message */}
                {(selectedContact.message || selectedContact.context_notes || selectedContact.metadata?.voice_notes) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Notes from Capture</h3>
                    <div className="bg-muted/30 rounded-lg p-3 text-sm whitespace-pre-wrap">
                      {selectedContact.context_notes || selectedContact.metadata?.voice_notes || selectedContact.message || 'No notes'}
                    </div>
                  </div>
                )}

                {/* Sent Email */}
                {selectedContact.first_email_sent_at && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Follow-up Email Sent
                      <Badge className="bg-green-600 text-xs">Sent</Badge>
                    </h3>
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Sent: {new Date(selectedContact.first_email_sent_at).toLocaleString()}</p>
                      {selectedContact.first_email_subject && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">Subject:</p>
                          <p className="text-sm font-medium">{selectedContact.first_email_subject}</p>
                        </>
                      )}
                      {selectedContact.first_email_body && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">Body:</p>
                          <p className="text-sm whitespace-pre-wrap">{selectedContact.first_email_body}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Generated Email (not sent yet) */}
                {selectedContact.metadata?.ai_generated_email && !selectedContact.first_email_sent_at && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      AI Generated Follow-up Email
                      <Badge variant="outline" className="text-xs">Draft</Badge>
                    </h3>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Subject:</p>
                      <p className="text-sm font-medium">{selectedContact.metadata.ai_generated_email.subject}</p>
                      <p className="text-xs text-muted-foreground mt-2">Body:</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedContact.metadata.ai_generated_email.body}</p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(selectedContact.created_at).toLocaleString()}</span>
                    </div>
                    {selectedContact.metadata?.scanned_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Scanned:</span>
                        <span>{new Date(selectedContact.metadata.scanned_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="sidePanelStatus">Status</Label>
                    <Select value={detailStatus} onValueChange={(value) => setDetailStatus(value as typeof statusOptions[number])}>
                      <SelectTrigger id="sidePanelStatus">
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
                    <Label htmlFor="sidePanelNotes">Internal Notes</Label>
                    <Textarea
                      id="sidePanelNotes"
                      value={detailNotes}
                      onChange={(e) => setDetailNotes(e.target.value)}
                      placeholder="Add follow-up notes, meeting details, etc."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSaveDetail}
                    disabled={updateContactMutation.isPending}
                    className="w-full"
                  >
                    {updateContactMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
