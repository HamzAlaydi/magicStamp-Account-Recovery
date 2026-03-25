import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agent {
  id: string;
  username: string;
  role: 'admin' | 'support';
}

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedAgent = localStorage.getItem('agent');
    if (savedToken && savedAgent) {
      setToken(savedToken);
      setAgent(JSON.parse(savedAgent));
    }
  }, []);

  const login = (newToken: string, newAgent: Agent) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('agent', JSON.stringify(newAgent));
    setToken(newToken);
    setAgent(newAgent);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('agent');
    setToken(null);
    setAgent(null);
  };

  return (
    <AuthContext.Provider value={{ agent, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
