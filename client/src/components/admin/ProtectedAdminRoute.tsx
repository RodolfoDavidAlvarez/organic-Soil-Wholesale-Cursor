import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { admin, loading } = useAdminAuth();

  // TEMPORARY: Allow access without authentication for development
  // TODO: Re-enable authentication check before deployment
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Always allow access during development
  return <>{children}</>;
  
  /* ORIGINAL AUTH CHECK - DISABLED FOR DEVELOPMENT
  if (!admin) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
  */
}