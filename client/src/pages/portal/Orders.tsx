import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, ArrowRight, ClipboardList, Truck, MapPin } from 'lucide-react';
import PortalLayout from './PortalLayout';

const statusColors: Record<string, string> = {
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-sky-50 text-sky-700 border-sky-200',
  in_production: 'bg-violet-50 text-violet-700 border-violet-200',
  ready_for_pickup: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  out_for_delivery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-gray-50 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending_approval: 'Pending Approval',
  pending: 'Pending',
  approved: 'Approved',
  in_production: 'In Production',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  item_count: number;
  fulfillment_type: string;
}

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/portal/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">Orders</h1>
          <Link href="/portal/orders/new">
            <Button size="sm" className="shadow-sm">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> New Order
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground/70 mb-5">Browse products and place your first order</p>
            <Link href="/portal/orders/new">
              <Button>Place Your First Order</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order) => (
              <Link key={order.id} href={`/portal/orders/${order.id}`}>
                <div className="group rounded-xl bg-white/70 border border-primary/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                        {order.fulfillment_type === 'delivery' ? (
                          <Truck className="h-4 w-4 text-primary/70" />
                        ) : (
                          <MapPin className="h-4 w-4 text-primary/70" />
                        )}
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-sm group-hover:text-primary transition-colors">
                          #{order.order_number.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' \u00b7 '}
                          {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-heading font-bold text-sm">${Number(order.total).toLocaleString()}</p>
                        <Badge variant="outline" className={`text-[10px] font-medium mt-0.5 ${statusColors[order.status] || ''}`}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Orders;
