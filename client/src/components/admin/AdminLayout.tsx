import React, { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import {
  ClipboardList,
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
  BarChart3,
  Bell,
  UserCircle,
  BookUser,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/admin",
  },
  {
    label: "Products",
    icon: <Package className="w-5 h-5" />,
    href: "/admin/products",
  },
  {
    label: "Orders",
    icon: <ShoppingCart className="w-5 h-5" />,
    href: "/admin/orders",
  },
  {
    label: "Customers",
    icon: <Users className="w-5 h-5" />,
    href: "/admin/customers",
  },
  {
    label: "Inventory",
    icon: <AlertCircle className="w-5 h-5" />,
    href: "/admin/inventory",
  },
  {
    label: "Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/admin/analytics",
  },
  {
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    href: "/admin/notifications",
  },
  {
    label: "Surveys",
    icon: <ClipboardList className="w-5 h-5" />,
    href: "/admin/surveys",
  },
  {
    label: "Rep. Contact Cards",
    icon: <UserCircle className="w-5 h-5" />,
    href: "/admin/representatives",
  },
  {
    label: "CRM Contacts",
    icon: <BookUser className="w-5 h-5" />,
    href: "/admin/representative-contacts",
  },
  {
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
    href: "/admin/settings",
  },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [location, navigate] = useLocation();
  const { admin, signOut } = useAdminAuth();

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
  };

  const normalizedLocation = location.split("?")[0];

  const handleSignOut = async () => {
    await signOut();
    // Ensure navigation happens after state is cleared
    setTimeout(() => {
      navigate("/admin/login");
    }, 100);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            {!sidebarCollapsed && <h1 className="text-xl font-bold text-green-800">Admin Panel</h1>}
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
            <button
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={toggleCollapse}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
            </button>
          </div>

          {/* Admin info */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b space-y-1">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate" title={admin?.full_name || admin?.email || undefined}>
                  {admin?.full_name || admin?.email || "Admin"}
                </p>
                {admin?.full_name && admin?.email && (
                  <p className="text-xs text-gray-500 truncate" title={admin.email}>
                    {admin.email}
                  </p>
                )}
              </div>
              {admin?.role && <p className="text-xs text-gray-500 capitalize">{admin.role.replace("_", " ")}</p>}
            </div>
          )}

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-1", sidebarCollapsed ? "p-2" : "p-4 space-y-2")}>
            {navItems.map((item) => {
              // Hide "Rep. Contact Cards" for regular admins (only show for super admins)
              if (item.href === "/admin/representatives" && admin?.role !== "super_admin") {
                return null;
              }
              const isActive = item.href === "/admin" ? normalizedLocation === item.href : normalizedLocation.startsWith(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg transition-colors",
                    sidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-green-50 text-green-800 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </a>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className={cn("border-t", sidebarCollapsed ? "p-2" : "p-4")}>
            <Button
              variant="outline"
              className={cn(sidebarCollapsed ? "w-full justify-center p-3" : "w-full justify-start gap-3")}
              onClick={handleSignOut}
              title={sidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && "Sign Out"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
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
        <main className="flex-1 overflow-y-auto bg-gray-50 admin-layout">
          <div className="container mx-auto px-4 pt-4 lg:px-6 lg:pt-6 min-h-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
