import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Mail, Phone, User, Calendar, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const leadStatuses = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
type LeadStatus = typeof leadStatuses[number];

const statusConfig: Record<LeadStatus, { color: string; label: string }> = {
  new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
  contacted: { color: 'bg-yellow-100 text-yellow-800', label: 'Contacted' },
  quoted: { color: 'bg-orange-100 text-orange-800', label: 'Quoted' },
  won: { color: 'bg-green-100 text-green-800', label: 'Won' },
  lost: { color: 'bg-gray-100 text-gray-500', label: 'Lost' },
};

export default function AdminLeads() {
  const token = localStorage.getItem('adminToken');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: async () => {
      const res = await fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  // Run migration on mount to ensure columns exist
  useEffect(() => {
    fetch('/api/admin/leads/migrate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).catch(() => {}); // silently ignore if migration fails
  }, []);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: number; status?: string; admin_notes?: string }) => {
      const body: any = {};
      if (status !== undefined) body.status = status;
      if (admin_notes !== undefined) body.admin_notes = admin_notes;
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
    },
    onError: () => {
      toast({ title: 'Failed to update lead', variant: 'destructive' });
    },
  });

  const handleStatusChange = (leadId: number, newStatus: string) => {
    updateMutation.mutate({ id: leadId, status: newStatus });
    toast({ title: `Status updated to ${statusConfig[newStatus as LeadStatus]?.label || newStatus}` });
  };

  const handleSaveNotes = (leadId: number) => {
    const notes = editingNotes[leadId];
    if (notes === undefined) return;
    updateMutation.mutate({ id: leadId, admin_notes: notes });
    toast({ title: 'Notes saved' });
  };

  const toggleNotes = (leadId: number, currentNotes: string) => {
    const next = new Set(expandedNotes);
    if (next.has(leadId)) {
      next.delete(leadId);
      // Save on collapse if changed
      if (editingNotes[leadId] !== undefined && editingNotes[leadId] !== currentNotes) {
        handleSaveNotes(leadId);
      }
    } else {
      next.add(leadId);
      setEditingNotes(prev => ({ ...prev, [leadId]: currentNotes || '' }));
    }
    setExpandedNotes(next);
  };

  const filtered = (leads || []).filter((lead: any) => {
    if (activeTab === 'all') return true;
    const leadStatus = lead.status || 'new';
    return leadStatus === activeTab;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: (leads || []).length };
    leadStatuses.forEach(s => { counts[s] = 0; });
    (leads || []).forEach((l: any) => {
      const s = l.status || 'new';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  };
  const counts = getStatusCounts();

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Leads & Quote Requests</h1>
            <Badge variant="outline">{leads?.length || 0} total</Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              {leadStatuses.map(s => (
                <TabsTrigger key={s} value={s}>
                  {statusConfig[s].label} ({counts[s] || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : !filtered?.length ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No leads {activeTab !== 'all' ? `with status "${statusConfig[activeTab as LeadStatus]?.label}"` : 'yet'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((lead: any) => {
                    const phoneMatch = lead.message?.match(/Phone:\s*(.+)/);
                    const notesMatch = lead.message?.match(/Notes:\s*(.+)/s);
                    const phone = phoneMatch?.[1]?.split('\n')[0]?.trim();
                    const customerNotes = notesMatch?.[1]?.trim();
                    const leadStatus = (lead.status || 'new') as LeadStatus;
                    const badge = statusConfig[leadStatus] || statusConfig.new;
                    const isExpanded = expandedNotes.has(lead.id);

                    return (
                      <div key={lead.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="font-semibold">{lead.name}</span>
                              <Badge className={`${badge.color} text-xs`}>{badge.label}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>
                              {phone && phone !== 'No additional notes' && (
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{phone}</span>
                              )}
                            </div>
                            {customerNotes && customerNotes !== 'No additional notes' && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded p-2">{customerNotes}</p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <Select value={leadStatus} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                              <SelectTrigger className="h-7 w-[120px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {leadStatuses.map(s => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {statusConfig[s].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Notes toggle */}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => toggleNotes(lead.id, lead.admin_notes || '')}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <StickyNote className="h-3 w-3" />
                            {lead.admin_notes ? 'Edit notes' : 'Add notes'}
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editingNotes[lead.id] ?? lead.admin_notes ?? ''}
                                onChange={(e) => setEditingNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                placeholder="Internal notes about this lead..."
                                className="text-sm min-h-[60px]"
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => handleSaveNotes(lead.id)}
                                  disabled={updateMutation.isPending}
                                >
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          )}
                          {!isExpanded && lead.admin_notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{lead.admin_notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
