import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  permissions?: any;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored admin token
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Validate token and get admin info
      validateToken(token);
    } else {
      // No token, ensure admin state is cleared
      setAdmin(null);
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch("/api/admin/auth/validate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setError(null);
      } else {
        // Token is invalid, remove it and clear admin state
        localStorage.removeItem("adminToken");
        setAdmin(null);
        setError(null);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      // On network error, remove token and clear admin state
      localStorage.removeItem("adminToken");
      setAdmin(null);
      setError("Network error during authentication");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("adminToken", data.token);
        setAdmin(data.admin);
        setError(null);
      } else {
        setError(data.error || "Login failed");
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Clear admin state first
    setAdmin(null);
    setError(null);
    // Then clear token from localStorage
    localStorage.removeItem("adminToken");
    // Force state update to ensure UI reflects logout
    setLoading(false);
    // Small delay to ensure state is fully cleared
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        error,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
