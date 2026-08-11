import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, Casamento } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: Usuario | null;
  casamento: Casamento | null;
  loading: boolean;
  login: (email: string, senha?: string) => Promise<void>;
  register: (data: { email: string; senha?: string; nome_noivo: string; nome_noiva: string }) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  refreshCasamento: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  casamento: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setUser: () => {},
  refreshCasamento: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [casamento, setCasamento] = useState<Casamento | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const savedUserId = localStorage.getItem('ngd_user_id');
      if (savedUserId) {
        const res = await api.getMe(savedUserId);
        setUser(res.user);
        setCasamento(res.casamento);
      } else {
        setUser(null);
        setCasamento(null);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('ngd_user_id');
      setUser(null);
      setCasamento(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, senha?: string) => {
    setLoading(true);
    try {
      const res = await api.loginCredentials({ email, senha });
      setUser(res.user);
      setCasamento(res.casamento);
      localStorage.setItem('ngd_user_id', res.user.id);
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; senha?: string; nome_noivo: string; nome_noiva: string }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setCasamento(res.casamento);
      localStorage.setItem('ngd_user_id', res.user.id);
    } catch (err: any) {
      console.error('Register error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ngd_user_id');
    setUser(null);
    setCasamento(null);
  };

  const refreshCasamento = async () => {
    try {
      const currentCasam = await api.getCasamento();
      setCasamento(currentCasam);
    } catch (err) {
      console.error('Refresh wedding failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, casamento, loading, login, register, logout, setUser, refreshCasamento }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
