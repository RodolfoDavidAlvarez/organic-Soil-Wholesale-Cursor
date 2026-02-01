import { useState } from 'react';
import { Phone, Mail, Truck, Package, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

interface Contact {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

interface Deal {
  name: string;
  type: 'inbound' | 'outbound';
  material: string;
  loads: string;
  schedule: string;
  contacts: Contact[];
  notes?: string[];
}

// All deals with their contacts
const deals: Deal[] = [
  {
    name: 'Tyson/Vanguard',
    type: 'inbound',
    material: 'Poultry Litter',
    loads: '~3/day',
    schedule: 'Weekdays',
    contacts: [
      { name: 'Casey Ryan', role: 'Vanguard', phone: '(402) 630-7497' },
      { name: 'Frank Seratch', role: 'Vanguard', email: 'fseratch@vanguardrenewables.com' },
      { name: 'Ryan Botelho', role: 'Tyson', email: 'ryan.botelho@tyson.com' },
    ],
    notes: ['Simon receives at yard', 'Driver calls on arrival']
  },
  {
    name: 'Willcox Pistachio',
    type: 'outbound',
    material: 'Soil Amendment + Pistachio Shells',
    loads: '2/day',
    schedule: 'Feb 2-6',
    contacts: [
      { name: 'Juan Rodriguez', role: 'Farm Manager', phone: '(520) 507-0655', email: 'jwproduce@live.com' },
      { name: 'Shawn', role: 'Owner', email: 'scdvm@yahoo.com' },
    ],
    notes: ['Don from Phoenix ~8am', 'Coy from Congress ~11am', 'Outbound: Soil | Inbound: Shells']
  },
  {
    name: 'Jack/3LAG',
    type: 'outbound',
    material: 'Dog Food',
    loads: '4/month',
    schedule: 'Recurring',
    contacts: [
      { name: 'Jack Mendoza', role: 'Owner', email: 'jackm_23@msn.com' },
    ],
    notes: ['Bakersfield delivery', '~$1,478/mo revenue', 'Corn dog opportunity pending']
  },
];

// SSW Team contacts
const sswTeam: Contact[] = [
  { name: 'Simon', role: 'Yard Manager', phone: '602-290-1824' },
  { name: 'Kerry Cooper', role: 'Logistics', phone: '928-830-3304', email: 'kcooper@soilseedandwater.com' },
  { name: 'Rodo Alvarez', role: 'Operations', phone: '928-550-1649', email: 'ralvarez@soilseedandwater.com' },
];

// Drivers
const drivers: Contact[] = [
  { name: 'Don', role: 'Driver (Phoenix)', phone: '' },
  { name: 'Coy Cooper', role: 'Driver (Congress)', phone: '' },
];

export default function OperationsResources() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

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
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Drivers</h2>
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
                className="bg-white w-full sm:max-w-md sm:rounded-lg overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-4 flex items-center justify-between ${
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

                {/* Stats */}
                <div className="grid grid-cols-2 border-b">
                  <div className="p-4 border-r">
                    <div className="text-xs text-gray-400 uppercase">Loads</div>
                    <div className="text-lg font-bold text-gray-900">{selectedDeal.loads}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-gray-400 uppercase">Schedule</div>
                    <div className="text-lg font-bold text-gray-900">{selectedDeal.schedule}</div>
                  </div>
                </div>

                {/* Notes */}
                {selectedDeal.notes && selectedDeal.notes.length > 0 && (
                  <div className="p-4 border-b bg-gray-50">
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
                <div className="divide-y max-h-64 overflow-y-auto">
                  {selectedDeal.contacts.map(contact => (
                    <ContactRow key={contact.name} contact={contact} />
                  ))}
                </div>

                {/* Close */}
                <div className="p-4 border-t">
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
