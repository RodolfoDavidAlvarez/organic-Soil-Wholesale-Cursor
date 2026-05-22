import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Truck, Package, CheckCircle, Clock, MapPin, DollarSign } from 'lucide-react';
import PortalLayout from './PortalLayout';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  ready_for_pickup: 'bg-green-100 text-green-800',
  out_for_delivery: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  in_production: 'In Production',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  pending_approval: Clock,
  approved: CheckCircle,
  in_production: Package,
  ready_for_pickup: Package,
  out_for_delivery: Truck,
  completed: CheckCircle,
};

interface OrderItem {
  id: string;
  product_name?: string;
  format: string;
  size_option: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface StatusHistoryEntry {
  id: string;
  status?: string;
  new_status?: string;
  notes: string | null;
  created_at: string;
}

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  total: number;
  fulfillment_type: string;
  delivery_address: any;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  special_instructions: string | null;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistoryEntry[];
  deposit_amount: number | null;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  stripe_payment_link_id: string | null;
}

const OrderDetail = ({ params }: { params: { id: string } }) => {
  const { token } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/portal/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error('Order not found');
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id, token]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  if (error || !order) {
    return (
      <PortalLayout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
          <Link href="/portal/orders">
            <Button variant="outline">Back to Orders</Button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-5 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/portal/orders">
            <button className="p-2 hover:bg-primary/5 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-heading font-bold truncate">Order #{order.order_number.slice(0, 8)}</h1>
            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Badge variant="outline" className={`${statusColors[order.status] || 'bg-gray-50 text-gray-600'} border text-xs font-medium px-2.5 py-1`}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>

        {/* Items */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-heading font-bold text-sm">Order Items</h2>
          </div>
          <div className="px-5 pb-5">
            <div className="space-y-2.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-primary/8 rounded-lg bg-white/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name || item.format || item.size_option}</p>
                    <p className="text-xs text-muted-foreground">{item.size_option || item.format} x {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-sm">${Number(item.total_price).toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">${Number(item.unit_price).toLocaleString()} ea</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-primary/10">
                <span className="font-heading font-bold text-sm">Total</span>
                <span className="font-heading font-bold text-lg text-primary">${Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Status */}
        {order.deposit_amount != null && order.deposit_amount > 0 && (
          <div className={`rounded-xl border shadow-sm overflow-hidden ${order.deposit_paid ? 'bg-green-50/70 border-green-200' : 'bg-amber-50/70 border-amber-200'}`}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${order.deposit_paid ? 'text-green-600' : 'text-amber-600'}`} />
                <div>
                  <p className="font-heading font-bold text-sm">
                    Deposit: ${Number(order.deposit_amount).toLocaleString()}
                  </p>
                  {order.deposit_paid && order.deposit_paid_at && (
                    <p className="text-[11px] text-muted-foreground">
                      Paid on {new Date(order.deposit_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${order.deposit_paid ? 'border-green-300 text-green-700 bg-green-100' : 'border-amber-300 text-amber-700 bg-amber-100'}`}>
                {order.deposit_paid ? 'Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        )}

        {/* Fulfillment Details */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            {order.fulfillment_type === 'delivery' ? <Truck className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
            <h2 className="font-heading font-bold text-sm">
              {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'} Details
            </h2>
          </div>
          <div className="px-5 pb-5 space-y-2 text-sm">
            {order.fulfillment_type === 'pickup' && (
              <p className="text-muted-foreground">1634 N 19th Ave, Phoenix, AZ 85009</p>
            )}
            {order.fulfillment_type === 'delivery' && order.delivery_address && (
              <p className="text-muted-foreground">
                {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip}
              </p>
            )}
            {order.preferred_date && (
              <p className="text-sm"><span className="font-medium">Preferred Date:</span> {new Date(order.preferred_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            )}
            {order.preferred_time_start && (
              <p className="text-sm"><span className="font-medium">Time Window:</span> {order.preferred_time_start}{order.preferred_time_end ? ` - ${order.preferred_time_end}` : ''}</p>
            )}
            {order.special_instructions && (
              <p className="text-sm"><span className="font-medium">Notes:</span> {order.special_instructions}</p>
            )}
          </div>
        </div>

        {/* Status History */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-heading font-bold text-sm">Status History</h2>
            </div>
            <div className="px-5 pb-5">
              <div className="space-y-0">
                {order.status_history.map((entry, i) => {
                  const Icon = statusIcons[(entry.new_status || entry.status || '')] || Clock;
                  return (
                    <div key={entry.id} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <div className={`p-1.5 rounded-full ${i === 0 ? 'bg-primary text-white shadow-sm' : 'bg-primary/10 text-primary/50'}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {i < order.status_history.length - 1 && (
                          <div className="w-px flex-1 bg-primary/10 my-1" />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`font-medium text-sm ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{statusLabels[(entry.new_status || entry.status || '')] || (entry.new_status || entry.status || '')}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                          {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        {entry.notes && <p className="text-xs text-muted-foreground/80 mt-1">{entry.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default OrderDetail;
