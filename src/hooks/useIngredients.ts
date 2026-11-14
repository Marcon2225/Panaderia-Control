// F:\Programas\panaderia-control\src\hooks\useIngredients.ts
// Hook para gestión de ingredientes (materias primas)

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Ingredient, IngredientInsert, IngredientUpdate, IngredientWithCategory } from '../types/database';
import { useTenantId } from './useAuth';

interface UseIngredientsOptions {
  includeInactive?: boolean;
  categoryId?: string;
  lowStockOnly?: boolean;
}

interface UseIngredientsReturn {
  ingredients: IngredientWithCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Omit<IngredientInsert, 'tenant_id'>) => Promise<{ data: Ingredient | null; error: Error | null }>;
  update: (id: string, data: IngredientUpdate) => Promise<{ data: Ingredient | null; error: Error | null }>;
  delete: (id: string) => Promise<{ error: Error | null }>;
  getById: (id: string) => Promise<IngredientWithCategory | null>;
}

export function useIngredients(options: UseIngredientsOptions = {}): UseIngredientsReturn {
  const { includeInactive = false, categoryId, lowStockOnly = false } = options;
  const tenantId = useTenantId();
  const [ingredients, setIngredients] = useState<IngredientWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIngredients = useCallback(async () => {
    if (!tenantId) {
      setIngredients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ingredients')
        .select(`
          *,
          category:categories(*),
          supplier:suppliers(*)
        `)
        .eq('tenant_id', tenantId);

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (lowStockOnly) {
        query = query.lte('current_stock', 'min_stock');
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estado de stock para cada ingrediente
      const enriched = (data ?? []).map(ing => ({
        ...ing,
        stock_status: calculateStockStatus(ing.current_stock, ing.min_stock, ing.max_stock),
      }));

      setIngredients(enriched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, includeInactive, categoryId, lowStockOnly]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const create = async (data: Omit<IngredientInsert, 'tenant_id'>) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    const { data: result, error } = await supabase
      .from('ingredients')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (!error) {
      await fetchIngredients();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const update = async (id: string, data: IngredientUpdate) => {
    const { data: result, error } = await supabase
      .from('ingredients')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchIngredients();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const deleteIngredient = async (id: string) => {
    // Soft delete: marcar como inactivo
    const { error } = await supabase
      .from('ingredients')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      await fetchIngredients();
    }
    return { error: error ? new Error(error.message) : null };
  };

  const getById = async (id: string) => {
    const { data, error } = await supabase
      .from('ingredients')
      .select(`
        *,
        category:categories(*),
        supplier:suppliers(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;
    return {
      ...data,
      stock_status: calculateStockStatus(data.current_stock, data.min_stock, data.max_stock),
    };
  };

  return {
    ingredients,
    loading,
    error,
    refetch: fetchIngredients,
    create,
    update,
    delete: deleteIngredient,
    getById,
  };
}

// Utilidad para calcular estado de stock
function calculateStockStatus(
  current: number,
  min: number,
  _max: number | null
): 'ok' | 'low' | 'critical' | 'out' {
  if (current <= 0) return 'out';
  if (current <= min * 0.5) return 'critical';
  if (current <= min) return 'low';
  return 'ok';
}

// Hook para ingredientes con stock bajo/crítico (para alertas dashboard)
export function useLowStockIngredients() {
  return useIngredients({ lowStockOnly: true });
}

// Hook para estadísticas de ingredientes
export function useIngredientStats() {
  const { ingredients } = useIngredients({ includeInactive: false });

  const stats = {
    total: ingredients.length,
    low: ingredients.filter(i => i.stock_status === 'low').length,
    critical: ingredients.filter(i => i.stock_status === 'critical').length,
    out: ingredients.filter(i => i.stock_status === 'out').length,
    value: ingredients.reduce((sum, i) => sum + i.current_stock * i.cost_per_base_unit, 0),
  };

  return stats;
}