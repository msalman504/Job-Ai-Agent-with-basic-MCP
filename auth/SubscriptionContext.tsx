import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

export type UserRole = 'trial' | 'subscriber' | 'owner' | 'admin';

type SubscriptionContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('job-agent.role') : null;
    return (saved as UserRole) || 'trial';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('job-agent.role', role);
    } catch {}
  }, [role]);

  const value = useMemo(() => ({ role, setRole }), [role]);
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}

