import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  permissions: Record<string, any>;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: AdminUser | null;
  token: string | null;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
  checkSession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
      setIsAuthenticated(true);
      checkSession();
    }
  }, []);

  const checkSession = async (): Promise<boolean> => {
    const currentToken = token || localStorage.getItem('adminToken');
    
    if (!currentToken) {
      logout();
      return false;
    }

    try {
      const response = await fetch('/api/admin/auth/session', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();
      setAdmin(data.admin);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      logout();
      return false;
    }
  };

  const login = (newToken: string, newAdmin: AdminUser) => {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('adminToken');
    
    if (currentToken) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
    navigate('/admin/login');
  };

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated,
      admin,
      token,
      login,
      logout,
      checkSession,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};