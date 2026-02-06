import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { FileText, ClipboardList, LogOut, Calendar, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface OperationsLayoutProps {
  children: ReactNode;
}

export default function OperationsLayout({ children }: OperationsLayoutProps) {
  const [location, navigate] = useLocation();
  const { admin, signOut } = useAdminAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div>
              <h1 className="text-lg md:text-xl font-bold text-[#264027]">SSW Operations</h1>
              <p className="text-xs text-gray-500">Operations Management System</p>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.full_name || 'Operations Team'}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Secondary Navigation / Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 md:px-6">
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => navigate('/admin/operations')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${location === '/admin/operations' || location.startsWith('/admin/operations/bols')
                    ? 'border-[#264027] text-[#264027]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <FileText className="w-4 h-4" />
                BOL Management
              </button>
              <button
                onClick={() => navigate('/admin/operations/work-orders')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${location.startsWith('/admin/operations/work-orders')
                    ? 'border-[#264027] text-[#264027]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <ClipboardList className="w-4 h-4" />
                Work Orders
              </button>
              <button
                onClick={() => navigate('/admin/operations/cods')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${location.startsWith('/admin/operations/cods')
                    ? 'border-[#264027] text-[#264027]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <ShieldCheck className="w-4 h-4" />
                CODs
              </button>
              <button
                onClick={() => navigate('/admin/operations/resources')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${location === '/admin/operations/resources'
                    ? 'border-[#264027] text-[#264027]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Users className="w-4 h-4" />
                Resources
              </button>
              <button
                onClick={() => navigate('/admin/operations/calendar')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${location === '/admin/operations/calendar'
                    ? 'border-[#264027] text-[#264027]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                Logistics Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
