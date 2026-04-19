import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'admin' | 'member' | null;

interface UserData {
  role: Role;
  userId?: number;
  token?: string;
  fullName?: string;
}

interface AuthContextType {
  role: Role;
  userId: number | null;
  token: string | null;
  fullName: string | null;
  login: (data: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(() => {
    // Initialize role from localStorage if it exists
    const savedRole = localStorage.getItem('userRole');
    return (savedRole as Role) || null;
  });

  const [userId, setUserId] = useState<number | null>(() => {
    const savedUserId = localStorage.getItem('userId');
    return savedUserId ? parseInt(savedUserId, 10) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken') || null;
  });

  const [fullName, setFullName] = useState<string | null>(() => {
    return localStorage.getItem('userFullName') || null;
  });

  const login = (data: UserData) => {
    setRole(data.role);
    setUserId(data.userId || null);
    setToken(data.token || null);
    setFullName(data.fullName ?? null);
    
    if (data.role) localStorage.setItem('userRole', data.role);
    if (data.userId) localStorage.setItem('userId', data.userId.toString());
    if (data.token) localStorage.setItem('authToken', data.token);
    if (data.fullName) localStorage.setItem('userFullName', data.fullName);
    else localStorage.removeItem('userFullName');
  };

  const logout = () => {
    setRole(null);
    setUserId(null);
    setToken(null);
    setFullName(null);
    
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userFullName');
  };

  return (
    <AuthContext.Provider value={{ role, userId, token, fullName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
