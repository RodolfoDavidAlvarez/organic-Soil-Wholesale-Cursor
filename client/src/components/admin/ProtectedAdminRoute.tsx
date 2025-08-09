import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from './AdminLayout';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAuthenticated, checkSession } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkSession();
      if (!isValid) {
        navigate('/admin/login');
      }
    };

    if (!isAuthenticated) {
      navigate('/admin/login');
    } else {
      verifyAuth();
    }
  }, [isAuthenticated, checkSession, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default ProtectedAdminRoute;