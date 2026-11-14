// F:\Programas\panaderia-control\src\context\AuthContext.tsx
// Contexto de autenticación y tenant

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, Tenant } from '../types/database';

export interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  tenant: Tenant | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión inicial
  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
        await fetchTenant(session.user.id);
      }
      setLoading(false);
    };

    loadSession();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
        await fetchTenant(session.user.id);
      } else {
        setUser(null);
        setSupabaseUser(null);
        setTenant(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUid: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_uid', authUid)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    } else {
      setUser(data);
    }
  };

  const fetchTenant = async (authUid: string) => {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_uid', authUid)
      .single();

    if (userData?.tenant_id) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single();

      if (tenantData) setTenant(tenantData);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setTenant(null);
    setSession(null);
  };

  const refreshUser = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      tenant,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook para obtener solo el tenant_id (útil para queries)
export function useTenantId(): string | null {
  const { tenant } = useAuth();
  return tenant?.id ?? null;
}

// Hook para verificar roles
export function useRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}

export function useIsAdmin() {
  const role = useRole();
  return role === 'owner' || role === 'admin';
}

export function useCanManageInventory() {
  const role = useRole();
  return ['owner', 'admin', 'gerente', 'panadero'].includes(role ?? '');
}

export function useCanManageSales() {
  const role = useRole();
  return ['owner', 'admin', 'gerente', 'vendedor'].includes(role ?? '');
}