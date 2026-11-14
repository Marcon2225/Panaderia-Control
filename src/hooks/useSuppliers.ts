// F:\Programas\panaderia-control\src\hooks\useSuppliers.ts
// Hook para gestión de proveedores

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Supplier, SupplierInsert, SupplierUpdate } from '../types/database';
import { useTenantId } from './useAuth';

interface UseSuppliersOptions {
  includeInactive?: boolean;
}

interface UseSuppliersReturn {
  suppliers: Supplier[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Omit<SupplierInsert, 'tenant_id'>) => Promise<{ data: Supplier | null; error: Error | null }>;
  update: (id: string, data: SupplierUpdate) => Promise<{ data: Supplier | null; error: Error | null }>;
  delete: (id: string) => Promise<{ error: Error | null }>;
}

export function useSuppliers(options: UseSuppliersOptions = {}): UseSuppliersReturn {
  const { includeInactive = false } = options;
  const tenantId = useTenantId();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuppliers = useCallback(async () => {
    if (!tenantId) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSuppliers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, includeInactive]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const create = async (data: Omit<SupplierInsert, 'tenant_id'>) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    const { data: result, error } = await supabase
      .from('suppliers')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (!error) {
      await fetchSuppliers();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const update = async (id: string, data: SupplierUpdate) => {
    const { data: result, error } = await supabase
      .from('suppliers')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchSuppliers();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const deleteSupplier = async (id: string) => {
    // Soft delete
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      await fetchSuppliers();
    }
    return { error: error ? new Error(error.message) : null };
  };

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    create,
    update,
    delete: deleteSupplier,
  };
}