import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from './AdminLayout';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAuthenticated, checkSession } = useAdminAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Skip if already authenticated or already checked
    if (isAuthenticated || hasChecked) {
      setIsLoading(false);
      return;
    }

    const verifyAuth = async () => {
      try {
        // Check if we have a token stored
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          setHasChecked(true);
          return;
        }

        // Verify the session is still valid
        const isValid = await checkSession();
        setHasChecked(true);
        
        if (!isValid) {
          navigate('/admin/login');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        navigate('/admin/login');
        setHasChecked(true);
      }
    };

    verifyAuth();
  }, [isAuthenticated]); // Only re-run if authentication status changes

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default ProtectedAdminRoute;