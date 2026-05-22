import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday
} from 'date-fns';
import { useLocation } from 'wouter';
import { Calendar, ChevronLeft, ChevronRight, Truck, Package, MapPin, User, Phone, Clock, Plus, Pencil, Trash2, Save, Link2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OperationsLayout from '@/components/admin/OperationsLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';

// Database type (snake_case from API)
interface ScheduledLoadDB {
  id: number;
  date: string;
  time_slot: string | null;
  route_type: 'outbound' | 'inbound';
  customer: string;
  destination: string;
  material: string;
  quantity: string | null;
  driver: string | null;
  carrier_name: string | null;
  truck_number: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  deal: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend type (camelCase for UI)
interface ScheduledLoad {
  id: number;
  date: string;
  timeSlot: string;
  routeType: 'outbound' | 'inbound';
  customer: string;
  destination: string;
  material: string;
  quantity: string;
  driver: string;
  carrierName: string;
  truckNumber: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  deal: string;
  contactName: string;
  contactPhone: string;
  notes: string;
}

// Convert DB format to frontend format
function dbToFrontend(db: ScheduledLoadDB): ScheduledLoad {
  return {
    id: db.id,
    date: db.date.split('T')[0], // Extract date part only
    timeSlot: db.time_slot || '',
    routeType: db.route_type,
    customer: db.customer,
    destination: db.destination,
    material: db.material,
    quantity: db.quantity || '',
    driver: db.driver || '',
    carrierName: db.carrier_name || '',
    truckNumber: db.truck_number || '',
    status: db.status,
    deal: db.deal || '',
    contactName: db.contact_name || '',
    contactPhone: db.contact_phone || '',
    notes: db.notes || ''
  };
}

// Empty load template
const emptyLoad: Omit<ScheduledLoad, 'id'> = {
  date: format(new Date(), 'yyyy-MM-dd'),
  timeSlot: '',
  routeType: 'outbound',
  customer: '',
  destination: '',
  material: '',
  quantity: '',
  driver: '',
  carrierName: '',
  truckNumber: '',
  status: 'scheduled',
  deal: '',
  contactName: '',
  contactPhone: '',
  notes: ''
};

// Build the full month grid (6 rows x 7 cols = 42 days, including padding from prev/next months)
function getMonthGrid(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let current = gridStart;
  while (current <= gridEnd) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export default function OperationsCalendar() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Parse month from URL query param
  const getInitialDate = () => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month') || params.get('week');
    if (monthParam) {
      try {
        return parseISO(monthParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [selectedLoad, setSelectedLoad] = useState<ScheduledLoad | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLoad, setEditingLoad] = useState<ScheduledLoad | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLoad, setNewLoad] = useState<Omit<ScheduledLoad, 'id'>>(emptyLoad);
  const [linkCopied, setLinkCopied] = useState(false);

  // Build month grid
  const monthGrid = getMonthGrid(currentDate);
  const gridStart = monthGrid[0];
  const gridEnd = monthGrid[monthGrid.length - 1];

  // Fetch scheduled loads for the visible month grid range
  const { data: loads = [], isLoading, error } = useQuery<ScheduledLoad[]>({
    queryKey: ['scheduled-loads', format(gridStart, 'yyyy-MM-dd'), format(gridEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        weekStart: format(gridStart, 'yyyy-MM-dd'),
        weekEnd: format(addDays(gridEnd, 1), 'yyyy-MM-dd') // Add 1 day to include end date
      });

      const response = await fetch(`/api/admin/operations/scheduled-loads?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch scheduled loads');
      const data: ScheduledLoadDB[] = await response.json();
      return data.map(dbToFrontend);
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (load: Omit<ScheduledLoad, 'id'>) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/operations/scheduled-loads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(load)
      });
      if (!response.ok) throw new Error('Failed to create load');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-loads'] });
      setShowAddModal(false);
      setNewLoad(emptyLoad);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (load: ScheduledLoad) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/scheduled-loads/${load.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(load)
      });
      if (!response.ok) throw new Error('Failed to update load');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-loads'] });
      setIsEditing(false);
      setEditingLoad(null);
      setSelectedLoad(null);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/operations/scheduled-loads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete load');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-loads'] });
      setSelectedLoad(null);
    }
  });

  // Update URL when month changes
  useEffect(() => {
    const monthDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    navigate(`/admin/operations/calendar?month=${monthDate}`, { replace: true });
  }, [currentDate, navigate]);

  // Copy month link to clipboard
  const copyMonthLink = async () => {
    const monthDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const url = `${window.location.origin}/admin/operations/calendar?month=${monthDate}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Get loads for a specific date
  const getLoadsForDate = (date: Date) => {
    return loads.filter(load => isSameDay(parseISO(load.date), date));
  };

  // Navigate months
  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Count loads by type (only loads within the current month)
  const monthInbound = loads.filter(l => l.routeType === 'inbound' && isSameMonth(parseISO(l.date), currentDate)).length;
  const monthOutbound = loads.filter(l => l.routeType === 'outbound' && isSameMonth(parseISO(l.date), currentDate)).length;

  // Add new load
  const handleAddLoad = () => {
    createMutation.mutate(newLoad);
  };

  // Update load
  const handleUpdateLoad = () => {
    if (!editingLoad) return;
    updateMutation.mutate(editingLoad);
  };

  // Delete load
  const handleDeleteLoad = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Split grid into rows of 7
  const weeks: Date[][] = [];
  for (let i = 0; i < monthGrid.length; i += 7) {
    weeks.push(monthGrid.slice(i, i + 7));
  }

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ProtectedAdminRoute>
      <OperationsLayout>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#264027]" />
                <h1 className="text-lg font-semibold text-gray-900">Logistics Calendar</h1>
              </div>

              {/* Mobile: Month Navigation */}
              <div className="flex items-center justify-between sm:hidden">
                <Button variant="outline" size="icon" onClick={goToPrevMonth} className="h-10 w-10">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-medium text-center px-2">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-10 w-10">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile: Action Buttons */}
              <div className="flex items-center gap-2 sm:hidden">
                <Button
                  onClick={() => setShowAddModal(true)}
                  size="sm"
                  className="flex-1 bg-[#264027] hover:bg-[#3c5233] h-10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Load
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyMonthLink}
                  className="h-10 px-3"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="h-10 px-3">
                  Today
                </Button>
              </div>

              {/* Desktop: All Controls */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  onClick={() => setShowAddModal(true)}
                  size="sm"
                  className="bg-[#264027] hover:bg-[#3c5233] text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Load
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyMonthLink}
                  className="text-xs"
                >
                  {linkCopied ? (
                    <><Check className="w-3.5 h-3.5 mr-1 text-green-600" /> Copied!</>
                  ) : (
                    <><Link2 className="w-3.5 h-3.5 mr-1" /> Copy Link</>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                  Today
                </Button>
                <Button variant="outline" size="icon" onClick={goToPrevMonth} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[160px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Month Summary */}
            <div className="flex items-center gap-6 mb-4 bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{monthInbound}</span>
                <span className="text-sm text-gray-500">inbound</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{monthOutbound}</span>
                <span className="text-sm text-gray-500">outbound</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-3xl font-bold text-gray-900">{monthInbound + monthOutbound}</span>
                <span className="text-sm text-gray-500">total loads</span>
              </div>
            </div>

            {/* Loading/Error State */}
            {isLoading && (
              <div className="bg-white rounded-lg border p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#264027] mr-2" />
                <span className="text-gray-500">Loading schedule...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                Failed to load schedule. Please try again.
              </div>
            )}

            {/* Month Calendar Grid */}
            {!isLoading && !error && (
              <div className="bg-white rounded-lg border overflow-hidden">
                {/* Day of week headers */}
                <div className="grid grid-cols-7 border-b bg-gray-50">
                  {dayHeaders.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center border-r last:border-r-0"
                    >
                      <div className="text-xs font-medium text-gray-500 uppercase">{day}</div>
                    </div>
                  ))}
                </div>

                {/* Week rows */}
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                    {week.map((day) => {
                      const dayLoads = getLoadsForDate(day);
                      const inCurrentMonth = isSameMonth(day, currentDate);
                      const todayHighlight = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-r last:border-r-0 p-1 min-h-[90px] sm:min-h-[110px] ${
                            todayHighlight
                              ? 'bg-[#264027]/5'
                              : inCurrentMonth
                                ? 'bg-white'
                                : 'bg-gray-50/70'
                          }`}
                        >
                          {/* Date number */}
                          <div className="flex items-center justify-between mb-0.5">
                            <span
                              className={`text-xs font-medium leading-none px-1 py-0.5 rounded ${
                                todayHighlight
                                  ? 'bg-[#264027] text-white'
                                  : inCurrentMonth
                                    ? 'text-gray-900'
                                    : 'text-gray-400'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>
                          </div>

                          {/* Load cards */}
                          {dayLoads.slice(0, 3).map((load) => (
                            <button
                              key={load.id}
                              onClick={() => setSelectedLoad(load)}
                              className={`w-full text-left px-1 py-0.5 mb-0.5 rounded text-[9px] sm:text-[10px] leading-tight transition-all hover:shadow-md truncate ${
                                load.routeType === 'inbound'
                                  ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                                  : 'bg-green-50 border border-green-200 hover:bg-green-100'
                              }`}
                            >
                              <div className="flex items-center gap-0.5">
                                {load.routeType === 'inbound' ? (
                                  <Package className="w-2 h-2 text-blue-600 flex-shrink-0" />
                                ) : (
                                  <Truck className="w-2 h-2 text-green-600 flex-shrink-0" />
                                )}
                                <span className={`font-semibold truncate ${load.routeType === 'inbound' ? 'text-blue-700' : 'text-green-700'}`}>
                                  {load.customer}
                                </span>
                              </div>
                            </button>
                          ))}

                          {/* Overflow indicator */}
                          {dayLoads.length > 3 && (
                            <div className="text-[9px] text-gray-500 text-center font-medium">
                              +{dayLoads.length - 3} more
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Load Detail/Edit Modal */}
          {selectedLoad && (
            <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setSelectedLoad(null); setIsEditing(false); }}>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-4 sm:my-0" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${
                        selectedLoad.routeType === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedLoad.routeType === 'inbound' ? <><Package className="w-3 h-3" /> INBOUND</> : <><Truck className="w-3 h-3" /> OUTBOUND</>}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedLoad.customer}</h3>
                      <p className="text-sm text-gray-500">{format(parseISO(selectedLoad.date), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                    <button onClick={() => { setSelectedLoad(null); setIsEditing(false); }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">&times;</button>
                  </div>
                </div>

                {!isEditing ? (
                  <>
                    {/* Load Details */}
                    <div className="p-4 space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Driver</div>
                          <div className="font-medium text-gray-900">{selectedLoad.driver || 'TBD'}</div>
                          {selectedLoad.carrierName && <div className="text-sm text-gray-500">{selectedLoad.carrierName}</div>}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Destination</div>
                          <div className="text-gray-900 mt-1">{selectedLoad.destination}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                            <div className="font-medium text-gray-900">{selectedLoad.timeSlot || 'TBD'}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Material</div>
                            <div className="text-sm text-gray-900">{selectedLoad.material}</div>
                          </div>
                        </div>
                      </div>

                      {(selectedLoad.contactName || selectedLoad.contactPhone) && (
                        <div className="flex items-start gap-3 p-3 bg-[#264027]/5 rounded-lg border border-[#264027]/10">
                          <Phone className="w-5 h-5 text-[#264027] mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Contact</div>
                            <div className="font-medium text-gray-900">{selectedLoad.contactName}</div>
                            {selectedLoad.contactPhone && (
                              <a href={`tel:${selectedLoad.contactPhone}`} className="text-[#264027] font-mono text-sm hover:underline">
                                {selectedLoad.contactPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedLoad.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                          <strong>Note:</strong> {selectedLoad.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t flex gap-3">
                      <Button variant="outline" className="flex-1 h-11" onClick={() => { setIsEditing(true); setEditingLoad({ ...selectedLoad }); }}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 px-4"
                        onClick={() => handleDeleteLoad(selectedLoad.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Edit Form */}
                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                        <Input
                          type="date"
                          value={editingLoad?.date || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, date: e.target.value } : null)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Customer</label>
                        <Input
                          value={editingLoad?.customer || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, customer: e.target.value } : null)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Driver</label>
                        <Input
                          value={editingLoad?.driver || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, driver: e.target.value } : null)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Time Slot</label>
                        <Input
                          value={editingLoad?.timeSlot || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, timeSlot: e.target.value } : null)}
                          className="h-11"
                          placeholder="e.g., 8:00 AM"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Material</label>
                        <Input
                          value={editingLoad?.material || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, material: e.target.value } : null)}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                        <Input
                          value={editingLoad?.notes || ''}
                          onChange={(e) => setEditingLoad(prev => prev ? { ...prev, notes: e.target.value } : null)}
                          className="h-11"
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="p-4 border-t flex gap-3">
                      <Button
                        className="flex-1 bg-[#264027] hover:bg-[#3c5233] h-11"
                        onClick={handleUpdateLoad}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button variant="outline" className="h-11 px-6" onClick={() => { setIsEditing(false); setEditingLoad(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Add Load Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full my-4 sm:my-0 flex flex-col max-h-[calc(100vh-2rem)]" onClick={(e) => e.stopPropagation()}>
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Load</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">&times;</button>
                </div>

                {/* Scrollable Form Content */}
                <div className="overflow-y-auto flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                      <Select value={newLoad.routeType} onValueChange={(v: 'inbound' | 'outbound') => setNewLoad({ ...newLoad, routeType: v })}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outbound">Outbound (Delivery)</SelectItem>
                          <SelectItem value="inbound">Inbound (Receiving)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                      <Input type="date" value={newLoad.date} onChange={(e) => setNewLoad({ ...newLoad, date: e.target.value })} className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Customer</label>
                      <Input value={newLoad.customer} onChange={(e) => setNewLoad({ ...newLoad, customer: e.target.value })} className="h-11" placeholder="Customer name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Driver</label>
                        <Input value={newLoad.driver} onChange={(e) => setNewLoad({ ...newLoad, driver: e.target.value })} className="h-11" placeholder="Driver name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Time Slot</label>
                        <Input value={newLoad.timeSlot} onChange={(e) => setNewLoad({ ...newLoad, timeSlot: e.target.value })} className="h-11" placeholder="e.g., 8:00 AM" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Destination</label>
                      <Input value={newLoad.destination} onChange={(e) => setNewLoad({ ...newLoad, destination: e.target.value })} className="h-11" placeholder="Delivery address" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Material</label>
                        <Input value={newLoad.material} onChange={(e) => setNewLoad({ ...newLoad, material: e.target.value })} className="h-11" placeholder="Material type" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity</label>
                        <Input value={newLoad.quantity} onChange={(e) => setNewLoad({ ...newLoad, quantity: e.target.value })} className="h-11" placeholder="~25 tons" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Deal</label>
                      <Input value={newLoad.deal} onChange={(e) => setNewLoad({ ...newLoad, deal: e.target.value })} className="h-11" placeholder="Deal/project name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Contact Name</label>
                        <Input value={newLoad.contactName} onChange={(e) => setNewLoad({ ...newLoad, contactName: e.target.value })} className="h-11" placeholder="Contact name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Contact Phone</label>
                        <Input value={newLoad.contactPhone} onChange={(e) => setNewLoad({ ...newLoad, contactPhone: e.target.value })} className="h-11" placeholder="Phone number" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
                      <Input value={newLoad.notes} onChange={(e) => setNewLoad({ ...newLoad, notes: e.target.value })} className="h-11" placeholder="Additional notes" />
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t flex gap-3 flex-shrink-0">
                  <Button
                    className="flex-1 bg-[#264027] hover:bg-[#3c5233] h-11"
                    onClick={handleAddLoad}
                    disabled={createMutation.isPending || !newLoad.customer || !newLoad.destination || !newLoad.material}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Load
                  </Button>
                  <Button variant="outline" className="h-11 px-6" onClick={() => setShowAddModal(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </OperationsLayout>
    </ProtectedAdminRoute>
  );
}
