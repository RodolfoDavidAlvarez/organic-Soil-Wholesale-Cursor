import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, ShoppingCart, ClipboardList, User, LogOut, Leaf } from 'lucide-react';

const navItems = [
  { path: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/portal/orders/new', label: 'New Order', icon: ShoppingCart },
  { path: '/portal/orders', label: 'Orders', icon: ClipboardList },
  { path: '/portal/profile', label: 'Profile', icon: User },
];

const PortalLayout = ({ children }: { children: ReactNode }) => {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/portal') return location === '/portal';
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(168deg, hsl(150 20% 96%) 0%, hsl(40 25% 96%) 50%, hsl(150 15% 95%) 100%)',
    }}>
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/portal">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-heading font-bold tracking-tight">
                  Organic <span className="text-primary">Soil</span>
                </span>
                <span className="text-[10px] font-display italic text-[#c9a227] tracking-wide">Wholesale Portal</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-xs font-medium text-foreground/80">
                {user?.profile?.company_name || user?.email}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {user?.profile?.account_type === 'wholesale' ? 'Wholesale Account' : 'Commercial Account'}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom tab nav */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-primary/10 px-2 py-1 sticky bottom-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center py-2 px-3 cursor-pointer transition-all relative ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                }`}>
                  {active && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <Icon className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`} />
                  <span className={`text-[11px] mt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PortalLayout;
