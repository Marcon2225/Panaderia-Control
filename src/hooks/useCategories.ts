// F:\Programas\panaderia-control\src\hooks\useCategories.ts
// Hook para gestión de categorías

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '../types/database';
import { useTenantId } from './useAuth';

interface UseCategoriesOptions {
  type?: 'ingredient' | 'product';
  includeInactive?: boolean;
}

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Omit<CategoryInsert, 'tenant_id'>) => Promise<{ data: Category | null; error: Error | null }>;
  update: (id: string, data: CategoryUpdate) => Promise<{ data: Category | null; error: Error | null }>;
  delete: (id: string) => Promise<{ error: Error | null }>;
  getTree: () => Category[];
}

export function useCategories(options: UseCategoriesOptions = {}): UseCategoriesReturn {
  const { type, includeInactive = false } = options;
  const tenantId = useTenantId();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!tenantId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCategories(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, type, includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const create = async (data: Omit<CategoryInsert, 'tenant_id'>) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    const { data: result, error } = await supabase
      .from('categories')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (!error) {
      await fetchCategories();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const update = async (id: string, data: CategoryUpdate) => {
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchCategories();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const deleteCategory = async (id: string) => {
    // Soft delete
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      await fetchCategories();
    }
    return { error: error ? new Error(error.message) : null };
  };

  // Construir árbol jerárquico
  const getTree = useCallback(() => {
    const categoryMap = new Map<string, Category & { children: Category[] }>();

    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const roots: Category[] = [];
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    create,
    update,
    delete: deleteCategory,
    getTree,
  };
}

// Hooks especializados
export function useIngredientCategories() {
  return useCategories({ type: 'ingredient' });
}

export function useProductCategories() {
  return useCategories({ type: 'product' });
}