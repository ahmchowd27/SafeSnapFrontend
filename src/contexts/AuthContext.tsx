import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('safesnap_token');
    const storedUser = localStorage.getItem('safesnap_user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate that the parsed user data has required properties
        if (userData && typeof userData === 'object' && userData.id && userData.email && userData.role) {
          setUser(userData);
        } else {
          console.error('Invalid stored user data format:', userData);
          localStorage.removeItem('safesnap_token');
          localStorage.removeItem('safesnap_user');
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('safesnap_token');
        localStorage.removeItem('safesnap_user');
      }
    }

    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('safesnap_token', token);
    localStorage.setItem('safesnap_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('safesnap_token');
    localStorage.removeItem('safesnap_user');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && !!localStorage.getItem('safesnap_token'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
