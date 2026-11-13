import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  registerCustomer: (data: any) => Promise<any>;
  registerRetailer: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (data: any) => {
    const res = await authApi.login(data);
    const authData = res.data;
    setToken(authData.token);
    localStorage.setItem('token', authData.token);

    const userInfo: User = {
      id: authData.userId,
      name: authData.name,
      email: authData.email,
      role: authData.role,
      emailVerified: authData.emailVerified,
      accountStatus: 'ACTIVE',
      retailerId: authData.retailerId,
      retailerApprovalStatus: authData.retailerApprovalStatus,
    };
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
    return userInfo;
  };

  const registerCustomer = async (data: any) => {
    const res = await authApi.registerCustomer(data);
    const authData = res.data;
    if (authData.token) {
      setToken(authData.token);
      localStorage.setItem('token', authData.token);
      const userInfo: User = {
        id: authData.userId,
        name: authData.name,
        email: authData.email,
        role: authData.role,
        emailVerified: authData.emailVerified,
        accountStatus: 'ACTIVE',
      };
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    return res;
  };

  const registerRetailer = async (data: any) => {
    const res = await authApi.registerRetailer(data);
    const authData = res.data;
    if (authData.token) {
      setToken(authData.token);
      localStorage.setItem('token', authData.token);
      const userInfo: User = {
        id: authData.userId,
        name: authData.name,
        email: authData.email,
        role: authData.role,
        emailVerified: authData.emailVerified,
        accountStatus: 'ACTIVE',
        retailerId: authData.retailerId,
        retailerApprovalStatus: authData.retailerApprovalStatus,
      };
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      localStorage.setItem('user', JSON.stringify(me));
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        registerCustomer,
        registerRetailer,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

