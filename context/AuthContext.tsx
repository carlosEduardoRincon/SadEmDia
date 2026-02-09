import React, { createContext, useContext } from 'react';
import { User } from '../types';

type AuthContextType = {
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export const AuthContextProvider = AuthContext.Provider;
