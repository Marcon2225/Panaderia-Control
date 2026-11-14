// F:\Programas\panaderia-control\src\hooks\useSales.ts
// Hook para gestión de Ventas (POS, tickets, histórico, cierres de caja)

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Sale,
  SaleUpdate,
  SaleItem,
  SalePayment,
  CashClosing,
  CashClosingInsert,
  CashMovement,
  Customer,
} from '../types/database';
import { useTenantId } from './useAuth';

// ============================================
// TIPOS EXTENDIDOS PARA UI
// ============================================
export interface SaleWithDetails extends Sale {
  items: SaleItemWithProduct[];
  payments: SalePayment[];
  customer: Customer | null;
  cashier: { id: string; name: string } | null;
}

export interface SaleItemWithProduct extends SaleItem {
  product: { id: string; name: string; category: string } | null;
}

export interface POSCartItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  discountPct: number;
  taxRate: number;
}

export interface ClosingExpected {
  expectedCash: number;
  expectedCard: number;
  expectedOther: number;
  expectedTotal: number;
  breakdown: {
    salesCash: number;
    salesCard: number;
    salesOther: number;
    cashMovements: number;
    openingCash: number;
  };
}

// ============================================
// HOOK PRINCIPAL: VENTAS
// ============================================
interface UseSalesOptions {
  status?: Sale['status'];
  cashierId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface UseSalesReturn {
  sales: SaleWithDetails[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // POS: carrito activo (venta 'abierta')
  activeSale: SaleWithDetails | null;
  setActiveSale: (sale: SaleWithDetails | null) => void;
  // Acciones POS
  createSale: (data: CreateSaleData) => Promise<{ data: Sale | null; error: Error | null }>;
  updateSale: (id: string, data: SaleUpdate) => Promise<{ data: Sale | null; error: Error | null }>;
  deleteSale: (id: string) => Promise<{ error: Error | null }>;
  getSaleById: (id: string) => Promise<SaleWithDetails | null>;
  // Items
  addSaleItem: (saleId: string, item: SaleItemData) => Promise<{ data: SaleItem | null; error: Error | null }>;
  updateSaleItem: (itemId: string, data: Partial<SaleItemData>) => Promise<{ data: SaleItem | null; error: Error | null }>;
  removeSaleItem: (itemId: string) => Promise<{ error: Error | null }>;
  // Pagos
  addPayment: (saleId: string, payment: PaymentData) => Promise<{ data: SalePayment | null; error: Error | null }>;
  removePayment: (paymentId: string) => Promise<{ error: Error | null }>;
  // Cierre
  finalizeSale: (saleId: string) => Promise<{ data: Sale | null; error: Error | null }>;
  cancelSale: (saleId: string) => Promise<{ data: Sale | null; error: Error | null }>;
}

export interface CreateSaleData {
  customerId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface SaleItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discountPct?: number;
  taxRate?: number;
  notes?: string;
}

export interface PaymentData {
  paymentMethod: Sale['payment_method'];
  amount: number;
  reference?: string;
  notes?: string;
}

export function useSales(options: UseSalesOptions = {}): UseSalesReturn {
  const {
    status,
    cashierId,
    customerId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;
  const tenantId = useTenantId();
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeSale, setActiveSale] = useState<SaleWithDetails | null>(null);

  const fetchSales = useCallback(async () => {
    if (!tenantId) {
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*),
          payments:sale_payments(*),
          customer:customers(*),
          cashier:users!cashier_id(id, name)
        `)
        .eq('tenant_id', tenantId)
        .order('opened_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);
      if (cashierId) query = query.eq('cashier_id', cashierId);
      if (customerId) query = query.eq('customer_id', customerId);
      if (startDate) query = query.gte('opened_at', startDate);
      if (endDate) query = query.lte('opened_at', endDate);

      const { data, error } = await query;

      if (error) throw error;

      // Enriquecer items con info de producto
      const enriched = await Promise.all((data ?? []).map(async (sale) => {
        const itemsWithProduct = await Promise.all((sale.items ?? []).map(async (item: SaleItem) => {
          const { data: product } = await supabase
            .from('products')
            .select('id, name, category')
            .eq('id', item.product_id)
            .single();
          return { ...item, product };
        }));

        return {
          ...sale,
          items: itemsWithProduct,
        } as SaleWithDetails;
      }));

      setSales(enriched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId, status, cashierId, customerId, startDate, endDate, limit, offset]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Crear venta (carrito nuevo)
  const createSale = async (data: CreateSaleData) => {
    if (!tenantId) return { data: null, error: new Error('No hay tenant activo') };

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_uid', user?.id)
      .single();

    if (!profile) {
      return { data: null, error: new Error('Usuario no encontrado en el tenant') };
    }

    const { data: result, error } = await supabase
      .from('sales')
      .insert({
        tenant_id: tenantId,
        customer_id: data.customerId ?? null,
        cashier_id: profile.id,
        status: 'abierta',
        notes: data.notes ?? null,
        metadata: data.metadata ?? {},
      })
      .select()
      .single();

    if (!error) {
      await fetchSales();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Actualizar venta
  const updateSale = async (id: string, data: SaleUpdate) => {
    const { data: result, error } = await supabase
      .from('sales')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchSales();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Eliminar venta (solo si está 'abierta' o 'cancelada')
  const deleteSale = async (id: string) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .in('status', ['abierta', 'cancelada']);

    if (!error) {
      await fetchSales();
    }
    return { error: error ? new Error(error.message) : null };
  };

  // Obtener venta por ID con detalles
  const getSaleById = async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items(*),
        payments:sale_payments(*),
        customer:customers(*),
        cashier:users!cashier_id(id, name)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    const itemsWithProduct = await Promise.all((data.items ?? []).map(async (item: SaleItem) => {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('id', item.product_id)
        .single();
      return { ...item, product };
    }));

    return { ...data, items: itemsWithProduct } as SaleWithDetails;
  };

  // Añadir línea a venta
  const addSaleItem = async (saleId: string, item: SaleItemData) => {
    const { data: result, error } = await supabase
      .from('sale_items')
      .insert({
        sale_id: saleId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_cost: item.unitCost ?? 0,
        discount_pct: item.discountPct ?? 0,
        tax_rate: item.taxRate ?? 0,
        notes: item.notes ?? null,
      })
      .select()
      .single();

    if (!error) {
      await fetchSales();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Actualizar línea
  const updateSaleItem = async (itemId: string, data: Partial<SaleItemData>) => {
    const updateData: Record<string, unknown> = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
    if (data.unitCost !== undefined) updateData.unit_cost = data.unitCost;
    if (data.discountPct !== undefined) updateData.discount_pct = data.discountPct;
    if (data.taxRate !== undefined) updateData.tax_rate = data.taxRate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const { data: result, error } = await supabase
      .from('sale_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (!error) {
      await fetchSales();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Eliminar línea
  const removeSaleItem = async (itemId: string) => {
    const { error } = await supabase
      .from('sale_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      await fetchSales();
    }
    return { error: error ? new Error(error.message) : null };
  };

  // Añadir pago
  const addPayment = async (saleId: string, payment: PaymentData) => {
    const { data: result, error } = await supabase
      .from('sale_payments')
      .insert({
        sale_id: saleId,
        payment_method: payment.paymentMethod,
        amount: payment.amount,
        reference: payment.reference ?? null,
        notes: payment.notes ?? null,
      })
      .select()
      .single();

    if (!error) {
      await fetchSales();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  // Eliminar pago
  const removePayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('sale_payments')
      .delete()
      .eq('id', paymentId);

    if (!error) {
      await fetchSales();
    }
    return { error: error ? new Error(error.message) : null };
  };

  // Finalizar venta (marcar como pagada)
  const finalizeSale = async (saleId: string) => {
    // Verificar que pagos cubren total
    const { data: sale } = await supabase
      .from('sales')
      .select('total')
      .eq('id', saleId)
      .single();

    const { data: payments } = await supabase
      .from('sale_payments')
      .select('amount')
      .eq('sale_id', saleId);

    const paid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    const total = Number(sale?.total ?? 0);

    if (paid < total - 0.01) { // tolerancia 1 céntimo
      return { data: null, error: new Error(`Pago insuficiente: ${paid.toFixed(2)} de ${total.toFixed(2)}`) };
    }

    return updateSale(saleId, { status: 'pagada', closed_at: new Date().toISOString() });
  };

  // Cancelar venta
  const cancelSale = async (saleId: string) => {
    return updateSale(saleId, { status: 'cancelada', closed_at: new Date().toISOString() });
  };

  return {
    sales,
    loading,
    error,
    refetch: fetchSales,
    activeSale,
    setActiveSale,
    createSale,
    updateSale,
    deleteSale,
    getSaleById,
    addSaleItem,
    updateSaleItem,
    removeSaleItem,
    addPayment,
    removePayment,
    finalizeSale,
    cancelSale,
  };
}

// ============================================
// HOOK: VENTA ACTIVA (CARRITO POS)
// ============================================
export function useActiveSale() {
  const { activeSale, setActiveSale, createSale, getSaleById, ...rest } = useSales({ status: 'abierta', limit: 1 });

  // Crear o recuperar carrito activo
  const ensureActiveSale = useCallback(async () => {
    if (activeSale) return activeSale;

    // Buscar venta 'abierta' del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_uid', user?.id)
      .single();

    if (!profile) return null;

    const { data: existing } = await supabase
      .from('sales')
      .select('id')
      .eq('cashier_id', profile.id)
      .eq('status', 'abierta')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const fullSale = await getSaleById(existing.id);
      setActiveSale(fullSale);
      return fullSale;
    }

    // Crear nueva
    const { data: newSale } = await createSale({});
    if (newSale) {
      const fullSale = await getSaleById(newSale.id);
      setActiveSale(fullSale);
      return fullSale;
    }

    return null;
  }, [activeSale, createSale, getSaleById, setActiveSale]);

  return { activeSale, setActiveSale, ensureActiveSale, createSale, ...rest };
}

// ============================================
// HOOK: CIERRES DE CAJA
// ============================================
interface UseCashClosingsReturn {
  closings: CashClosing[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getExpectedClosing: (date: string, shift?: string) => Promise<ClosingExpected>;
  createClosing: (data: CreateClosingData) => Promise<{ data: CashClosing | null; error: Error | null }>;
  updateClosing: (id: string, data: Partial<CashClosingInsert>) => Promise<{ data: CashClosing | null; error: Error | null }>;
  getClosingById: (id: string) => Promise<CashClosing | null>;
  // Movimientos de caja
  addCashMovement: (data: CashMovementData) => Promise<{ data: CashMovement | null; error: Error | null }>;
  getCashMovements: (closingId?: string) => Promise<CashMovement[]>;
}

export interface CreateClosingData {
  date: string; // YYYY-MM-DD
  shift?: string;
  countedCash: number;
  countedCard: number;
  countedOther?: number;
  notes?: string;
}

export interface CashMovementData {
  type: CashMovement['type'];
  amount: number;
  reason: string;
  cashClosingId?: string;
  referenceType?: CashMovement['reference_type'];
  referenceId?: string;
}

export function useCashClosings(): UseCashClosingsReturn {
  const tenantId = useTenantId();
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClosings = useCallback(async () => {
    if (!tenantId) {
      setClosings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cash_closings')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setClosings(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchClosings();
  }, [fetchClosings]);

  // Calcular esperado para cierre
  const getExpectedClosing = async (date: string, shift?: string): Promise<ClosingExpected> => {
    const { data, error } = await supabase.rpc('calculate_expected_closing', {
      p_date: date,
      p_shift: shift ?? null,
    });

    if (error) throw new Error(error.message);
    return {
      expectedCash: Number(data.expected_cash),
      expectedCard: Number(data.expected_card),
      expectedOther: Number(data.expected_other),
      expectedTotal: Number(data.expected_total),
      breakdown: data.breakdown as ClosingExpected['breakdown'],
    };
  };

  // Crear/actualizar cierre
  const createClosing = async (data: CreateClosingData) => {
    const { data: result, error } = await supabase.rpc('create_cash_closing', {
      p_date: data.date,
      p_shift: data.shift ?? 'único',
      p_counted_cash: data.countedCash,
      p_counted_card: data.countedCard,
      p_counted_other: data.countedOther ?? 0,
      p_notes: data.notes ?? null,
    });

    if (!error) {
      await fetchClosings();
    }
    return { data: result as CashClosing | null, error: error ? new Error(error.message) : null };
  };

  const updateClosing = async (id: string, data: Partial<CashClosingInsert>) => {
    const { data: result, error } = await supabase
      .from('cash_closings')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchClosings();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const getClosingById = async (id: string) => {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;
    return data;
  };

  // Movimientos de caja
  const addCashMovement = async (data: CashMovementData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_uid', user?.id)
      .single();

    if (!profile) {
      return { data: null, error: new Error('Usuario no encontrado') };
    }

    const { data: result, error } = await supabase
      .from('cash_movements')
      .insert({
        tenant_id: tenantId,
        cash_closing_id: data.cashClosingId ?? null,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        reference_type: data.referenceType ?? null,
        reference_id: data.referenceId ?? null,
        user_id: profile.id,
      })
      .select()
      .single();

    return { data: result, error: error ? new Error(error.message) : null };
  };

  const getCashMovements = async (closingId?: string) => {
    let query = supabase
      .from('cash_movements')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (closingId) query = query.eq('cash_closing_id', closingId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  };

  return {
    closings,
    loading,
    error,
    refetch: fetchClosings,
    getExpectedClosing,
    createClosing,
    updateClosing,
    getClosingById,
    addCashMovement,
    getCashMovements,
  };
}

// ============================================
// HOOK: CLIENTES (para POS)
// ============================================
export interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  search: (query: string) => Promise<Customer[]>;
  create: (data: CreateCustomerData) => Promise<{ data: Customer | null; error: Error | null }>;
  update: (id: string, data: Partial<Customer>) => Promise<{ data: Customer | null; error: Error | null }>;
  getById: (id: string) => Promise<Customer | null>;
  quickCreate: (name: string, phone?: string, email?: string) => Promise<Customer | null>;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  birthday?: string;
  tags?: string[];
  notes?: string;
}

export function useCustomers(): UseCustomersReturn {
  const tenantId = useTenantId();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!tenantId) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const search = async (query: string) => {
    const { data, error } = await supabase.rpc('search_customers', {
      p_query: query,
      p_limit: 10,
    });

    if (error) throw new Error(error.message);
    return data ?? [];
  };

  const create = async (data: CreateCustomerData) => {
    const { data: result, error } = await supabase
      .from('customers')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (!error) {
      await fetchCustomers();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const update = async (id: string, data: Partial<Customer>) => {
    const { data: result, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (!error) {
      await fetchCustomers();
    }
    return { data: result, error: error ? new Error(error.message) : null };
  };

  const getById = async (id: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;
    return data;
  };

  const quickCreate = async (name: string, phone?: string, email?: string) => {
    const { data, error } = await supabase.rpc('quick_create_customer', {
      p_name: name,
      p_phone: phone ?? null,
      p_email: email ?? null,
    });

    if (error) throw new Error(error.message);
    if (data) await fetchCustomers();
    return data;
  };

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    search,
    create,
    update,
    getById,
    quickCreate,
  };
}