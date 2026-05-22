import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ShoppingCart, FileText, Clock, CheckCircle, Loader2, ArrowRight, Leaf, Sprout } from 'lucide-react';
import PortalLayout from './PortalLayout';
import WelcomeWalkthrough from '@/components/WelcomeWalkthrough';

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
}

const Dashboard = () => {
  const { user, token } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const appRes = await fetch('/api/portal/application', { headers });
        if (appRes.ok) {
          const appData = await appRes.json();
          setApplicationStatus(appData.application?.status || null);
        }
        const ordRes = await fetch('/api/portal/orders?limit=5', { headers });
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(ordData.orders || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const hasApplication = applicationStatus && applicationStatus !== 'none';
  const canOrder = hasApplication && applicationStatus !== 'rejected';

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
      <WelcomeWalkthrough variant="wholesale" />
      <div className="space-y-6 pb-6">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <Sprout className="w-full h-full" strokeWidth={0.5} />
          </div>
          <div className="relative">
            <p className="text-primary-foreground/70 text-sm font-medium">Welcome back</p>
            <h1 className="text-2xl font-heading font-bold mt-0.5">
              {user?.profile?.company_name || user?.profile?.full_name || 'Your Account'}
            </h1>
            {user?.profile?.full_name && user?.profile?.company_name && (
              <p className="text-primary-foreground/60 text-sm mt-1">{user.profile.full_name}</p>
            )}
          </div>
        </div>

        {/* Application CTA */}
        {!hasApplication && (
          <Card className="border-[#c9a227]/30 bg-gradient-to-r from-[#c9a227]/5 to-[#c9a227]/10 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-1.5 bg-[#c9a227]" />
                <div className="flex items-start gap-4 p-5 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a227]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-5 w-5 text-[#c9a227]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-heading font-bold mb-1">Complete Your Application</h2>
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      Fill out a quick wholesale application to start ordering. Takes about 3 minutes.
                    </p>
                    <Link href="/portal/application">
                      <Button size="sm" className="bg-[#c9a227] hover:bg-[#b07d1f] text-white shadow-sm">
                        Start Application <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Status */}
        {hasApplication && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 border border-primary/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Application</span>
            </div>
            <Badge variant="outline" className={`${statusColors[applicationStatus!] || 'bg-gray-50 text-gray-600'} border text-xs font-medium px-2.5 py-0.5`}>
              {applicationStatus === 'submitted' ? 'Under Review' :
               applicationStatus === 'approved' ? 'Approved' :
               applicationStatus === 'draft' ? 'Draft' :
               applicationStatus === 'rejected' ? 'Rejected' : applicationStatus}
            </Badge>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/portal/orders/new">
            <div className={`group cursor-pointer rounded-xl bg-white/70 border border-primary/10 p-5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all ${!canOrder ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading font-semibold text-sm">Place Order</p>
              <p className="text-xs text-muted-foreground mt-0.5">From your cart</p>
            </div>
          </Link>
          <Link href="/products">
            <div className="group cursor-pointer rounded-xl bg-white/70 border border-primary/10 p-5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <p className="font-heading font-semibold text-sm">Browse Products</p>
              <p className="text-xs text-muted-foreground mt-0.5">28 products</p>
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl bg-white/70 border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-heading font-bold text-base">Recent Orders</h2>
            {orders.length > 0 && (
              <Link href="/portal/orders">
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">View all</span>
              </Link>
            )}
          </div>
          <div className="px-5 pb-5">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Your orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <Link key={order.id} href={`/portal/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3.5 rounded-lg border border-transparent hover:border-primary/10 hover:bg-primary/[0.02] cursor-pointer transition-all group">
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          #{order.order_number.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {order.item_count > 0 && ` \u00b7 ${order.item_count} item${order.item_count !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-heading font-semibold text-sm">${Number(order.total).toLocaleString()}</p>
                          <Badge variant="outline" className={`text-[10px] font-medium ${statusColors[order.status] || ''}`}>
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;
