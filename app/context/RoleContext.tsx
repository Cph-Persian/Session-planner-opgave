'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'teacher' | null;

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isTeacherLoggedIn: boolean;
  setIsTeacherLoggedIn: (logged: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    const savedTeacherLoggedIn = localStorage.getItem('isTeacherLoggedIn') === 'true';
    
    if (savedRole) {
      setRole(savedRole);
      setIsTeacherLoggedIn(savedTeacherLoggedIn);
    }
    setIsHydrated(true);
  }, []);

  // Save role to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      if (role) {
        localStorage.setItem('userRole', role);
      } else {
        localStorage.removeItem('userRole');
      }
      localStorage.setItem('isTeacherLoggedIn', String(isTeacherLoggedIn));
    }
  }, [role, isTeacherLoggedIn, isHydrated]);

  return (
    <RoleContext.Provider value={{ role, setRole, isTeacherLoggedIn, setIsTeacherLoggedIn }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
