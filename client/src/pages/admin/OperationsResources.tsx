import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, Truck, Package, ChevronRight, X, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { useLocation } from 'wouter';

interface Contact {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

interface Deal {
  name: string;
  clientTag: string;
  type: 'inbound' | 'outbound';
  material: string;
  deliveryAddress: string;
  pricing?: string;
  loads: string;
  schedule: string;
  contacts: Contact[];
  notes?: string[];
}

// All deals with their contacts - CORRECTED from email research Feb 6 2026
const deals: Deal[] = [
  {
    name: 'Vanguard/Tyson',
    clientTag: 'vanguard',
    type: 'inbound',
    material: 'Corn Dogs (Tyson Food Waste)',
    deliveryAddress: '18980 Stanton Rd, Congress, AZ 85332',
    pricing: 'Processing fee per Vanguard contract',
    loads: '~3/day',
    schedule: 'Weekdays, FCFS 7am-2:30pm',
    contacts: [
      { name: 'Andrew Johnson', role: 'Vanguard - Logistics Dispatch', email: 'ajohnson@vanguardrenewables.com' },
      { name: 'Nick Graziano', role: 'Vanguard (replaced Casey Tucker)', email: 'ngraziano@vanguardrenewables.com' },
      { name: 'Frank Seratch', role: 'Vanguard - Organics Market Mgr', email: 'fseratch@vanguardrenewables.com' },
      { name: 'David Portilla', role: 'Tyson - Sustainability Mgr', email: 'David.Portilla@tyson.com' },
      { name: 'John Stackhouse', role: 'Tyson - Transportation Dispatch', email: 'John.Stackhouse@tyson.com' },
      { name: 'Ryan Botelho', role: 'Tyson', email: 'Ryan.Botelho@tyson.com' },
      { name: 'CFX Phoenix', role: 'Trucking Broker', email: 'tyson@cfxphoenix.com' },
      { name: 'Nat\'l Logistics & Dispatch', role: 'Vanguard', email: 'NatLogDispatch@vanguardrenewables.com' },
    ],
    notes: [
      'Simon receives at yard, drivers call on arrival',
      'CODs required same-day (Kerry produces)',
      'Scale tickets + COD sent to Frank & NatLogDispatch',
      'CHEP pallets: +$3/ton handling labor',
      'Last check-in 2:00 PM MST, closed weekends',
      'Casey Tucker NO LONGER at Vanguard — use Nick Graziano',
    ]
  },
  {
    name: 'Willcox Pistachio',
    clientTag: 'willcox',
    type: 'outbound',
    material: 'Pistachio Blend (90% dairy compost, 10% worm castings + 2% zeolite)',
    deliveryAddress: '6601 W Black Rd, Willcox, AZ',
    pricing: '$76.66/ton (base) · $88.10/ton (with gypsum)',
    loads: '~2/day',
    schedule: 'Target: 4 trucks/week until bud break (Mar 15-20)',
    contacts: [
      { name: 'Juan Rodriguez', role: 'Farm Manager', phone: '520-450-7655', email: 'jwproduce@live.com' },
      { name: 'Shawn', role: 'Owner', email: 'scdvm@yahoo.com' },
    ],
    notes: [
      'Don LaFollette departs Phoenix ~8am (360-600-9103)',
      'Coy Cooper departs Congress ~11am (928-379-1444)',
      'Outbound: Soil blend | Inbound: Pistachio shells',
      'Target: ~112 acres, ~3.4 tons/row, 25 tons = 7-8 rows',
      'Next visit: Feb 16-17 with consultant',
    ]
  },
  {
    name: 'Jack/3LAG',
    clientTag: '3lag',
    type: 'outbound',
    material: 'Dog Food (depack/processing)',
    deliveryAddress: '18980 Stanton Rd, Congress, AZ 85332 (pickup)',
    pricing: '$20/ton',
    loads: '4 loads/run',
    schedule: 'Recurring',
    contacts: [
      { name: 'Jack Mendoza', role: 'Owner', email: 'jackm_23@msn.com' },
      { name: 'Bradley Booker', role: '3LAG - Trucking Setup' },
      { name: 'Melissa Hieronymus', role: '3LAG - System Setup' },
      { name: 'Eddie Lugo', role: '3LAG - Operations' },
    ],
    notes: [
      'Loads must be >20 tons each',
      'Loading hours: 6am-2:30pm',
      '$5,000 on-site support budget (Jack: Tue-Thu)',
      'Depack training + tub grinder workflow',
    ]
  },
];

// SSW Team contacts
const sswTeam: Contact[] = [
  { name: 'Simon Carrasco', role: 'Yard Manager / Scale Operator', phone: '602-290-1824', email: 'simoncarrasco64@gmail.com' },
  { name: 'Kerry Cooper', role: 'Logistics / BOLs / CODs', phone: '928-830-3304', email: 'kcooper@soilseedandwater.com' },
  { name: 'Rodo Alvarez', role: 'Operations', phone: '623-263-3386', email: 'ralvarez@soilseedandwater.com' },
];

// Drivers
const drivers: Contact[] = [
  { name: 'Don LaFollette', role: 'Driver (Phoenix)', phone: '360-600-9103' },
  { name: 'Coy Cooper', role: 'Driver (Congress)', phone: '928-379-1444' },
  { name: 'Shane Grimm', role: 'Walking Floor / Logistics', phone: '602-621-3995', email: 'shane.grimm@agave-inc.com' },
];

function useDealStats(clientTag: string) {
  const token = localStorage.getItem('adminToken');
  const bolQuery = useQuery({
    queryKey: ['deal-bols', clientTag],
    queryFn: async () => {
      const res = await fetch(`/api/admin/operations/bols?client_tag=${clientTag}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!clientTag,
  });
  const codQuery = useQuery({
    queryKey: ['deal-cods', clientTag],
    queryFn: async () => {
      const res = await fetch(`/api/admin/operations/cods?client_tag=${clientTag}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!clientTag,
  });
  return {
    bolCount: bolQuery.data?.length ?? 0,
    codCount: codQuery.data?.length ?? 0,
    loading: bolQuery.isLoading || codQuery.isLoading,
  };
}

function DealStatsBar({ clientTag }: { clientTag: string }) {
  const { bolCount, codCount, loading } = useDealStats(clientTag);
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex gap-3 mt-2">
        <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
        <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/admin/operations?client=${clientTag}`); }}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <FileText className="w-3 h-3" />
        {bolCount} BOL{bolCount !== 1 ? 's' : ''}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/admin/operations/cods?client=${clientTag}`); }}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <ClipboardList className="w-3 h-3" />
        {codCount} COD{codCount !== 1 ? 's' : ''}
      </button>
    </div>
  );
}

export default function OperationsResources() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [, navigate] = useLocation();

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Active Deals */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Deals</h2>
              <div className="space-y-2">
                {deals.map(deal => (
                  <button
                    key={deal.name}
                    onClick={() => setSelectedDeal(deal)}
                    className="w-full bg-white rounded-lg border p-4 flex items-center gap-4 hover:border-[#264027] hover:shadow-sm transition-all text-left"
                  >
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      deal.type === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {deal.type === 'inbound' ? (
                        <Package className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Truck className="w-5 h-5 text-green-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{deal.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          deal.type === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {deal.type.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 truncate">{deal.material}</div>
                      <DealStatsBar clientTag={deal.clientTag} />
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{deal.loads}</div>
                      <div className="text-xs text-gray-400">{deal.schedule}</div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </section>

            {/* SSW Team */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">SSW Team</h2>
              <div className="bg-white rounded-lg border divide-y">
                {sswTeam.map(contact => (
                  <ContactRow key={contact.name} contact={contact} />
                ))}
              </div>
            </section>

            {/* Drivers */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Drivers & Logistics</h2>
              <div className="bg-white rounded-lg border divide-y">
                {drivers.map(contact => (
                  <ContactRow key={contact.name} contact={contact} />
                ))}
              </div>
            </section>

          </div>

          {/* Deal Detail Modal */}
          {selectedDeal && (
            <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedDeal(null)}>
              <div
                className="bg-white w-full sm:max-w-md sm:rounded-lg overflow-hidden max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-4 flex items-center justify-between flex-shrink-0 ${
                  selectedDeal.type === 'inbound' ? 'bg-blue-50' : 'bg-green-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedDeal.type === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {selectedDeal.type === 'inbound' ? (
                        <Package className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Truck className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedDeal.name}</h3>
                      <p className="text-sm text-gray-500">{selectedDeal.material}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDeal(null)} className="p-2 hover:bg-black/5 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1">
                  {/* Stats */}
                  <div className="grid grid-cols-2 border-b">
                    <div className="p-4 border-r">
                      <div className="text-xs text-gray-400 uppercase">Loads</div>
                      <div className="text-lg font-bold text-gray-900">{selectedDeal.loads}</div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-gray-400 uppercase">Schedule</div>
                      <div className="text-sm font-bold text-gray-900">{selectedDeal.schedule}</div>
                    </div>
                  </div>

                  {/* Address & Pricing */}
                  <div className="p-4 border-b space-y-2">
                    <div>
                      <div className="text-xs text-gray-400 uppercase">Delivery Address</div>
                      <div className="text-sm text-gray-900">{selectedDeal.deliveryAddress}</div>
                    </div>
                    {selectedDeal.pricing && (
                      <div>
                        <div className="text-xs text-gray-400 uppercase">Pricing</div>
                        <div className="text-sm font-medium text-gray-900">{selectedDeal.pricing}</div>
                      </div>
                    )}
                  </div>

                  {/* Live Stats */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="text-xs text-gray-400 uppercase mb-2">Documents</div>
                    <DealStatsBar clientTag={selectedDeal.clientTag} />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setSelectedDeal(null); navigate(`/admin/operations?client=${selectedDeal.clientTag}`); }}
                      >
                        View BOLs
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => { setSelectedDeal(null); navigate(`/admin/operations/cods?client=${selectedDeal.clientTag}`); }}
                      >
                        View CODs
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedDeal.notes && selectedDeal.notes.length > 0 && (
                    <div className="p-4 border-b">
                      <div className="text-xs text-gray-400 uppercase mb-2">Notes</div>
                      <ul className="space-y-1">
                        {selectedDeal.notes.map((note, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-[#264027]">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="divide-y">
                    <div className="px-4 pt-3 pb-1">
                      <div className="text-xs text-gray-400 uppercase">Contacts</div>
                    </div>
                    {selectedDeal.contacts.map(contact => (
                      <ContactRow key={contact.name} contact={contact} />
                    ))}
                  </div>
                </div>

                {/* Close */}
                <div className="p-4 border-t flex-shrink-0">
                  <Button variant="outline" className="w-full" onClick={() => setSelectedDeal(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}

// Simple contact row component
function ContactRow({ contact }: { contact: Contact }) {
  return (
    <div className="p-3 flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{contact.name}</div>
        <div className="text-sm text-gray-500">{contact.role}</div>
      </div>
      <div className="flex items-center gap-2">
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="p-2 bg-[#264027] text-white rounded-full hover:bg-[#3c5233] transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}
