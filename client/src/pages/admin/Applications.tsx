import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Check, X, Eye, ChevronDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const statusBadge: Record<string, { color: string; icon: any }> = {
  submitted: { color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function AdminApplications() {
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const token = localStorage.getItem('adminToken');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['adminApplications'],
    queryFn: async () => {
      const res = await fetch('/api/admin/applications', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await fetch(`/api/admin/applications/${appId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approveNotes, credit_limit: creditLimit ? parseFloat(creditLimit) : null, payment_terms: paymentTerms || null }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      toast({ title: 'Application approved' });
      setShowApproveDialog(false);
      setSelectedApp(null);
      setApproveNotes('');
      setCreditLimit('');
      setPaymentTerms('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await fetch(`/api/admin/applications/${appId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminApplications'] });
      toast({ title: 'Application rejected' });
      setShowRejectDialog(false);
      setSelectedApp(null);
      setRejectReason('');
    },
  });

  const pending = (applications || []).filter((a: any) => a.status === 'submitted');
  const reviewed = (applications || []).filter((a: any) => a.status !== 'submitted');

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Wholesale Applications</h1>
            <Badge variant="outline" className="text-sm">
              {pending.length} pending
            </Badge>
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : applications?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No applications yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending */}
              {pending.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-amber-700 mb-3 uppercase tracking-wide">Pending Review ({pending.length})</h2>
                  <div className="space-y-3">
                    {pending.map((app: any) => (
                      <AppCard key={app.id} app={app} onView={() => setSelectedApp(app)} onApprove={() => { setSelectedApp(app); setShowApproveDialog(true); }} onReject={() => { setSelectedApp(app); setShowRejectDialog(true); }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewed */}
              {reviewed.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Reviewed ({reviewed.length})</h2>
                  <div className="space-y-3">
                    {reviewed.map((app: any) => (
                      <AppCard key={app.id} app={app} onView={() => setSelectedApp(app)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedApp && !showApproveDialog && !showRejectDialog} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4 text-sm">
                <Section title="Business">
                  <Field label="Legal Name" value={selectedApp.legal_entity_name} />
                  <Field label="DBA" value={selectedApp.dba_name} />
                  <Field label="Type" value={selectedApp.business_type} />
                  <Field label="EIN" value={selectedApp.ein_tax_id} />
                  <Field label="Years" value={selectedApp.years_in_business} />
                </Section>
                <Section title="Operations Contact">
                  <Field label="Name" value={selectedApp.ops_contact_name} />
                  <Field label="Email" value={selectedApp.ops_contact_email} />
                  <Field label="Phone" value={selectedApp.ops_contact_phone} />
                </Section>
                {selectedApp.ap_contact_name && (
                  <Section title="AP Contact">
                    <Field label="Name" value={selectedApp.ap_contact_name} />
                    <Field label="Email" value={selectedApp.ap_contact_email} />
                    <Field label="Phone" value={selectedApp.ap_contact_phone} />
                  </Section>
                )}
                <Section title="Preferences">
                  <Field label="Payment Method" value={selectedApp.preferred_payment_method} />
                  <Field label="Payment Terms" value={selectedApp.preferred_payment_terms} />
                  <Field label="Forklift" value={selectedApp.has_forklift ? 'Yes' : 'No'} />
                  <Field label="Delivery Instructions" value={selectedApp.delivery_instructions} />
                </Section>
                {selectedApp.credit_references?.length > 0 && (
                  <Section title="Credit References">
                    {selectedApp.credit_references.map((ref: any, i: number) => (
                      <div key={i} className="border rounded p-2 mb-2">
                        <p className="font-medium">{ref.company_name}</p>
                        <p className="text-gray-500">{ref.contact_name} - {ref.phone} - {ref.email}</p>
                      </div>
                    ))}
                  </Section>
                )}
                {selectedApp.status === 'submitted' && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => setShowApproveDialog(true)} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="h-4 w-4 mr-1" /> Approve</Button>
                    <Button onClick={() => setShowRejectDialog(true)} variant="destructive" className="flex-1"><X className="h-4 w-4 mr-1" /> Reject</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Approve Application</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Approving <strong>{selectedApp?.legal_entity_name}</strong></p>
              <div><Label>Credit Limit ($)</Label><Input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="Optional" /></div>
              <div><Label>Payment Terms</Label><Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" /></div>
              <div><Label>Notes</Label><Textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} placeholder="Optional notes" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => selectedApp && approveMutation.mutate(selectedApp.id)} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject Application</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Rejecting <strong>{selectedApp?.legal_entity_name}</strong></p>
              <div><Label>Reason</Label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => selectedApp && rejectMutation.mutate(selectedApp.id)} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}

function AppCard({ app, onView, onApprove, onReject }: { app: any; onView: () => void; onApprove?: () => void; onReject?: () => void }) {
  const badge = statusBadge[app.status] || statusBadge.submitted;
  const Icon = badge.icon;
  const profile = app.customer_profiles;
  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{app.legal_entity_name || 'Unnamed'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {app.business_type} {app.dba_name ? `(DBA: ${app.dba_name})` : ''} - {app.ops_contact_email || profile?.email}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={`${badge.color} text-xs`}><Icon className="h-3 w-3 mr-1" />{app.status}</Badge>
          <Button variant="ghost" size="sm" onClick={onView}><Eye className="h-4 w-4" /></Button>
          {app.status === 'submitted' && onApprove && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-2" onClick={onApprove}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="destructive" className="h-8 px-2" onClick={onReject}><X className="h-3.5 w-3.5" /></Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-xs text-gray-400 uppercase tracking-wide mb-1.5">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
