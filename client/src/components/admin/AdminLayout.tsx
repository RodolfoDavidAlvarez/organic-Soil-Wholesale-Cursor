import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: '/admin'
  },
  {
    label: 'Products',
    icon: <Package className="w-5 h-5" />,
    href: '/admin/products'
  },
  {
    label: 'Orders',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/admin/orders'
  },
  {
    label: 'Customers',
    icon: <Users className="w-5 h-5" />,
    href: '/admin/customers'
  },
  {
    label: 'Inventory',
    icon: <AlertCircle className="w-5 h-5" />,
    href: '/admin/inventory'
  },
  {
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/admin/analytics'
  },
  {
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/admin/settings'
  }
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { admin, signOut } = useAdminAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-green-800">Admin Panel</h1>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Admin info */}
          <div className="p-4 border-b">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-medium">{admin?.full_name || admin?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{admin?.role?.replace('_', ' ')}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-colors',
                  location === item.href
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'hover:bg-gray-100'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-gray-500">Today's Revenue:</span>
                  <span className="ml-2 font-semibold">$0.00</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Pending Orders:</span>
                  <span className="ml-2 font-semibold">0</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}