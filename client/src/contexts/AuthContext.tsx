import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface CustomerProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  company_name?: string;
  account_type: 'retail' | 'wholesale' | 'commercial';
  credit_limit: number;
  payment_terms: string;
  is_approved: boolean;
}

interface User {
  id: string;
  email: string;
  profile: CustomerProfile;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<{ requiresApproval: boolean }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  loading: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  companyName?: string;
  accountType?: 'retail' | 'wholesale' | 'commercial';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('customerToken');
    
    if (storedToken) {
      setToken(storedToken);
      // Verify the token is still valid
      checkSession();
    } else {
      setLoading(false);
    }
  }, []);

  const checkSession = async (): Promise<boolean> => {
    const currentToken = token || localStorage.getItem('customerToken');
    
    if (!currentToken) {
      setLoading(false);
      return false;
    }

    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid session');
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      signOut();
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign in failed');
      }

      const data = await response.json();
      
      // Store token
      localStorage.setItem('customerToken', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Navigate to appropriate page based on account type
      if (data.user.profile.account_type === 'retail') {
        navigate('/products');
      } else {
        navigate('/wholesale');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (signUpData: SignUpData): Promise<{ requiresApproval: boolean }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signUpData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign up failed');
      }

      const data = await response.json();
      return { requiresApproval: data.requiresApproval };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const currentToken = token || localStorage.getItem('customerToken');
    
    if (currentToken) {
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }

    // Clear local state
    localStorage.removeItem('customerToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      token,
      signIn,
      signUp,
      signOut,
      checkSession,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};