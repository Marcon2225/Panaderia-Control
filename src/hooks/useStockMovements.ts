// F:\Programas\panaderia-control\src\hooks\useStockMovements.ts
// Hook para movimientos de stock (historial + entradas/salidas/ajustes)

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  StockMovement,
  StockMovementInsert,
  StockMovementWithDetails,
} from '../types/database';
import { useTenantId } from './useAuth';

interface UseStockMovementsOptions {
  entityType?: 'ingredient' | 'product';
  entityId?: string;
  movementType?: StockMovementInsert['movement_type'];
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface UseStockMovementsReturn {
  movements: StockMovementWithDetails[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Acciones de stock (crean movimiento + actualizan stock atómicamente via trigger)
  addEntry: (data: StockEntryData) => Promise<{ data: StockMovement | null; error: Error | null }>;
  addExit: (data: StockExitData) => Promise<{ data: StockMovement | null; error: Error | null }>;
  addAdjustment: (data: StockAdjustmentData) => Promise<{ data: StockMovement | null; error: Error | null }>;
  addWaste: (data: StockWasteData) => Promise<{ data: StockMovement | null; error: Error | null }>;
  getById: (id: string) => Promise<StockMovementWithDetails | null>;
}

// Datos para cada tipo de movimiento
interface StockEntryData {
  entity_type: 'ingredient' | 'product';
  entity_id: string;
  quantity_base: number; // POSITIVO en unidad base
  unit_cost?: number;
  reason: string;
  reference_type?: StockMovementInsert['reference_type'];
  reference_id?: string;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface StockExitData {
  entity_type: 'ingredient' | 'product';
  entity_id: string;
  quantity_base: number; // NEGATIVO en unidad base
  unit_cost?: number;
  reason: string;
  reference_type?: StockMovementInsert['reference_type'];
  reference_id?: string;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface StockAdjustmentData {
  entity_type: 'ingredient' | 'product';
  entity_id: string;
  quantity_base: number; // POSITIVO (ajuste_positivo) o NEGATIVO (ajuste_negativo)
  reason: string;
  reference_type?: StockMovementInsert['reference_type'];
  reference_id?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface StockWasteData {
  entity_type: 'ingredient' | 'product';
  entity_id: string;
  quantity_base: number; // NEGATIVO en unidad base
  reason: string;
  reference_type?: StockMovementInsert['reference_type'];
  reference_id?: string;
  batch_number?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export function useStockMovements(options: UseStockMovementsOptions = {}): UseStockMovementsReturn {
  const { entityType, entityId, movementType, limit = 100, startDate, endDate } = options;
  const tenantId = useTenantId();
  const [movements, setMovements] = useState<StockMovementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMovements = useCallback(async () => {
    if (!tenantId) {
      setMovements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          user:users(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (movementType) {
        query = query.eq('movement_type', movementType);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Obtener nombres de entidades para mostrar
      const enriched = await Promise.all((data ?? []).map(async (mov) => {
        let entity_name = 'Desconocido';
        if (mov.entity_type === 'ingredient') {
          const { data: ing } = await supabase
            .from('ingredients')
            .select('name')
            .eq('id', mov.entity_id)
            .single();
          entity_name = ing?.name ?? 'Ingrediente eliminado';
        } else {
          const { data: prod } = await supabase
            .from('products')
            .select('name')
            .eq('id', mov.entity_id)
            .single();
          entity_name = prod?.name ?? 'Producto eliminado';
        }
        return { ...mov, entity_name };
      }));

      setMovements(enriched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, entityType, entityId, movementType, limit, startDate, endDate]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Función genérica para crear movimiento
  const createMovement = async (
    movement_type: StockMovementInsert['movement_type'],
    data: {
      entity_type: 'ingredient' | 'product';
      entity_id: string;
      quantity_base: number;
      unit_cost?: number | null;
      reason: string;
      reference_type?: StockMovementInsert['reference_type'] | null;
      reference_id?: string | null;
      batch_number?: string | null;
      expiry_date?: string | null;
      notes?: string | null;
      metadata?: Record<string, unknown>;
      user_id?: string;
    }
  ) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    // Obtener user_id del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_uid', user?.id)
      .single();

    if (!profile) {
      return { data: null, error: new Error('Usuario no encontrado en el tenant') };
    }

    // Validar signo según tipo de movimiento
    const positiveTypes: StockMovementInsert['movement_type'][] =
      ['entrada', 'ajuste_positivo', 'devolucion', 'produccion_salida'];
    const negativeTypes: StockMovementInsert['movement_type'][] =
      ['salida', 'ajuste_negativo', 'merma', 'produccion_entrada', 'venta'];

    const shouldBePositive = positiveTypes.includes(movement_type);
    const shouldBeNegative = negativeTypes.includes(movement_type);

    if (shouldBePositive && data.quantity_base <= 0) {
      return { data: null, error: new Error('La cantidad debe ser positiva para este tipo de movimiento') };
    }
    if (shouldBeNegative && data.quantity_base >= 0) {
      return { data: null, error: new Error('La cantidad debe ser negativa para este tipo de movimiento') };
    }

    const { data: result, error } = await supabase
      .from('stock_movements')
      .insert({
        tenant_id: tenantId,
        movement_type,
        user_id: profile.id,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        quantity_base: data.quantity_base,
        unit_cost: data.unit_cost ?? null,
        reason: data.reason,
        reference_type: data.reference_type ?? null,
        reference_id: data.reference_id ?? null,
        batch_number: data.batch_number ?? null,
        expiry_date: data.expiry_date ?? null,
        notes: data.notes ?? null,
        metadata: data.metadata ?? {},
      })
      .select()
      .single();

    if (!error) {
      await fetchMovements();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Métodos de conveniencia
  const addEntry = async (data: StockEntryData) =>
    createMovement('entrada', { ...data, metadata: data.metadata ?? {} });

  const addExit = async (data: StockExitData) =>
    createMovement('salida', { ...data, quantity_base: -Math.abs(data.quantity_base), metadata: data.metadata ?? {} });

  const addAdjustment = async (data: StockAdjustmentData) => {
    const movement_type = data.quantity_base > 0 ? 'ajuste_positivo' : 'ajuste_negativo';
    return createMovement(movement_type, { ...data, metadata: data.metadata ?? {} });
  };

  const addWaste = async (data: StockWasteData) =>
    createMovement('merma', { ...data, quantity_base: -Math.abs(data.quantity_base), metadata: data.metadata ?? {} });

  const getById = async (id: string) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    let entity_name = 'Desconocido';
    if (data.entity_type === 'ingredient') {
      const { data: ing } = await supabase
        .from('ingredients')
        .select('name')
        .eq('id', data.entity_id)
        .single();
      entity_name = ing?.name ?? 'Ingrediente eliminado';
    } else {
      const { data: prod } = await supabase
        .from('products')
        .select('name')
        .eq('id', data.entity_id)
        .single();
      entity_name = prod?.name ?? 'Producto eliminado';
    }

    return { ...data, entity_name };
  };

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements,
    addEntry,
    addExit,
    addAdjustment,
    addWaste,
    getById,
  };
}

// Hook para movimientos de un ingrediente específico
export function useIngredientMovements(ingredientId: string) {
  return useStockMovements({ entityType: 'ingredient', entityId: ingredientId });
}

// Hook para movimientos de un producto específico
export function useProductMovements(productId: string) {
  return useStockMovements({ entityType: 'product', entityId: productId });
}

// Hook para alertas de stock en tiempo real (usar con Supabase Realtime)
export function useStockAlerts() {
  const tenantId = useTenantId();
  const [alerts, setAlerts] = useState<{
    ingredients: Array<{ id: string; name: string; current: number; min: number; status: 'low' | 'critical' | 'out' }>;
    products: Array<{ id: string; name: string; current: number; min: number; status: 'low' | 'critical' | 'out' }>;
  }>({ ingredients: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const checkAlerts = async () => {
      // Ingredientes con stock bajo
      const { data: lowIngredients } = await supabase
        .from('ingredients')
        .select('id, name, current_stock, min_stock')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .lte('current_stock', 'min_stock');

      // Productos con stock bajo (solo los que track_stock)
      const { data: lowProducts } = await supabase
        .from('products')
        .select('id, name, current_stock, min_stock')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('track_stock', true)
        .lte('current_stock', 'min_stock');

      setAlerts({
        ingredients: (lowIngredients ?? []).map(i => ({
          id: i.id,
          name: i.name,
          current: i.current_stock,
          min: i.min_stock,
          status: i.current_stock <= 0 ? 'out' : i.current_stock <= i.min_stock * 0.5 ? 'critical' : 'low',
        })),
        products: (lowProducts ?? []).map(p => ({
          id: p.id,
          name: p.name,
          current: p.current_stock,
          min: p.min_stock,
          status: p.current_stock <= 0 ? 'out' : p.current_stock <= p.min_stock * 0.5 ? 'critical' : 'low',
        })),
      });
      setLoading(false);
    };

    checkAlerts();

    // Suscribirse a cambios en tiempo real
    const ingredientsChannel = supabase
      .channel('ingredients-stock-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ingredients',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => checkAlerts()
      )
      .subscribe();

    const productsChannel = supabase
      .channel('products-stock-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => checkAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ingredientsChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [tenantId]);

  return { alerts, loading };
}