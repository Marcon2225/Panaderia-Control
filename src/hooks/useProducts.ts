// F:\Programas\panaderia-control\src\hooks\useProducts.ts
// Hook para gestión de productos terminados

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductWithCategory,
  ProductIngredient,
  ProductIngredientInsert,
  ProductIngredientWithDetails
} from '../types/database';
import { useTenantId } from './useAuth';

interface UseProductsOptions {
  includeInactive?: boolean;
  categoryId?: string;
  sellableOnly?: boolean;
  lowStockOnly?: boolean;
}

interface UseProductsReturn {
  products: ProductWithCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (data: Omit<ProductInsert, 'tenant_id'>) => Promise<{ data: Product | null; error: Error | null }>;
  update: (id: string, data: ProductUpdate) => Promise<{ data: Product | null; error: Error | null }>;
  delete: (id: string) => Promise<{ error: Error | null }>;
  getById: (id: string) => Promise<ProductWithCategory | null>;
  // BOM management
  getIngredients: (productId: string) => Promise<ProductIngredientWithDetails[]>;
  addIngredient: (data: Omit<ProductIngredientInsert, 'product_id'>) => Promise<{ data: ProductIngredient | null; error: Error | null }>;
  updateIngredient: (id: string, data: Partial<ProductIngredientInsert>) => Promise<{ data: ProductIngredient | null; error: Error | null }>;
  removeIngredient: (id: string) => Promise<{ error: Error | null }>;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { includeInactive = false, categoryId, sellableOnly = false, lowStockOnly = false } = options;
  const tenantId = useTenantId();
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!tenantId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          ingredients:product_ingredients(
            *,
            ingredient:ingredients(*)
          )
        `)
        .eq('tenant_id', tenantId);

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      if (sellableOnly) {
        query = query.eq('is_sellable', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (lowStockOnly) {
        query = query.eq('track_stock', true).lte('current_stock', 'min_stock');
      }

      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Enriquecer con cálculos
      const enriched = (data ?? []).map(prod => {
        const ingredients = (prod.ingredients ?? []) as ProductIngredientWithDetails[];
        const cost = ingredients.reduce((sum, pi) =>
          sum + pi.quantity * pi.ingredient.cost_per_base_unit * (1 + pi.waste_factor), 0);
        const margin = prod.sale_price - cost;
        const marginPercent = prod.sale_price > 0 ? (margin / prod.sale_price) * 100 : 0;

        let stockStatus: ProductWithCategory['stock_status'] = 'not_tracked';
        if (prod.track_stock) {
          if (prod.current_stock <= 0) stockStatus = 'out';
          else if (prod.current_stock <= prod.min_stock * 0.5) stockStatus = 'critical';
          else if (prod.current_stock <= prod.min_stock) stockStatus = 'low';
          else stockStatus = 'ok';
        }

        return {
          ...prod,
          ingredients,
          cost,
          margin,
          margin_percent: marginPercent,
          stock_status: stockStatus,
        };
      });

      setProducts(enriched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, includeInactive, categoryId, sellableOnly, lowStockOnly]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const create = async (data: Omit<ProductInsert, 'tenant_id'>) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    const { data: result, error } = await supabase
      .from('products')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (!error) {
      await fetchProducts();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const update = async (id: string, data: ProductUpdate) => {
    const { data: result, error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchProducts();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const deleteProduct = async (id: string) => {
    // Soft delete
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      await fetchProducts();
    }
    return { error: error ? new Error(error.message) : null };
  };

  const getById = async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        ingredients:product_ingredients(
          *,
          ingredient:ingredients(*)
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    const ingredients = (data.ingredients ?? []) as ProductIngredientWithDetails[];
    const cost = ingredients.reduce((sum, pi) =>
      sum + pi.quantity * pi.ingredient.cost_per_base_unit * (1 + pi.waste_factor), 0);
    const margin = data.sale_price - cost;
    const marginPercent = data.sale_price > 0 ? (margin / data.sale_price) * 100 : 0;

    let stockStatus: ProductWithCategory['stock_status'] = 'not_tracked';
    if (data.track_stock) {
      if (data.current_stock <= 0) stockStatus = 'out';
      else if (data.current_stock <= data.min_stock * 0.5) stockStatus = 'critical';
      else if (data.current_stock <= data.min_stock) stockStatus = 'low';
      else stockStatus = 'ok';
    }

    return {
      ...data,
      ingredients,
      cost,
      margin,
      margin_percent: marginPercent,
      stock_status: stockStatus,
    };
  };

  // BOM Management
  const getIngredients = async (productId: string) => {
    const { data, error } = await supabase
      .from('product_ingredients')
      .select(`
        *,
        ingredient:ingredients(*)
      `)
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ProductIngredientWithDetails[];
  };

  const addIngredient = async (data: Omit<ProductIngredientInsert, 'product_id'>) => {
    const { data: result, error } = await supabase
      .from('product_ingredients')
      .insert(data)
      .select()
      .single();

    if (!error) {
      await fetchProducts(); // Refrescar para recalcular costes
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const updateIngredient = async (id: string, data: Partial<ProductIngredientInsert>) => {
    const { data: result, error } = await supabase
      .from('product_ingredients')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      await fetchProducts();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const removeIngredient = async (id: string) => {
    const { error } = await supabase
      .from('product_ingredients')
      .delete()
      .eq('id', id);

    if (!error) {
      await fetchProducts();
    }
    return { error: error ? new Error(error.message) : null };
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    create,
    update,
    delete: deleteProduct,
    getById,
    getIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
  };
}

// Hook para productos vendibles (POS)
export function useSellableProducts() {
  return useProducts({ sellableOnly: true });
}

// Hook para estadísticas de productos
export function useProductStats() {
  const { products } = useProducts({ includeInactive: false });

  const stats = {
    total: products.length,
    sellable: products.filter(p => p.is_sellable).length,
    lowStock: products.filter(p => p.stock_status === 'low').length,
    criticalStock: products.filter(p => p.stock_status === 'critical').length,
    outOfStock: products.filter(p => p.stock_status === 'out').length,
    totalValue: products.reduce((sum, p) => sum + p.current_stock * p.cost, 0),
    avgMargin: products.length > 0
      ? products.reduce((sum, p) => sum + p.margin_percent, 0) / products.length
      : 0,
  };

  return stats;
}