// F:\Programas\panaderia-control\src\types\database.ts
// Tipos TypeScript generados desde el schema de Supabase
// Regenerar con: npx supabase gen types typescript --project-id <project-id> --schema public > src/types/database.ts

// =============================================
// ENUMS
// =============================================
export type UserRole = 'owner' | 'admin' | 'gerente' | 'panadero' | 'vendedor' | 'repartidor';
export type CategoryType = 'ingredient' | 'product';
export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'unidad';
export type MovementType =
  | 'entrada'
  | 'salida'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'merma'
  | 'produccion_entrada'
  | 'produccion_salida'
  | 'venta'
  | 'devolucion';
export type ReferenceType =
  | 'purchase_order'
  | 'production_order'
  | 'sale'
  | 'adjustment'
  | 'waste_report';

// Ventas
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto' | 'ticket_restaurant' | 'otro';
export type SaleStatus = 'abierta' | 'pagada' | 'cancelada' | 'pendiente' | 'devolucion';
export type ClosingStatus = 'pendiente' | 'en_proceso' | 'completado' | 'con_diferencias' | 'aprobado';
export type CashMovementType = 'apertura' | 'entrada' | 'salida' | 'retiro' | 'deposito';
export type OrderStatus = 'pendiente' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
export type PaymentStatus = 'pendiente' | 'parcial' | 'pagado' | 'reembolsado';

// =============================================
// TABLES (Row types)
// =============================================
export interface Tenant {
  id: string;
  slug: string;
  business_name: string;
  trade_name: string | null;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  tax_rate: number;
  ticket_prefix: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_uid: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parent_id: string | null;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  tax_id: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  bank_account: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  tenant_id: string;
  category_id: string | null;
  supplier_id: string | null;
  code: string | null;
  name: string;
  description: string | null;
  base_unit: UnitType;
  current_stock: number;
  min_stock: number;
  max_stock: number | null;
  cost_per_base_unit: number;
  cost_method: string;
  lot_tracking: boolean;
  expiry_tracking: boolean;
  allergen_info: string[] | null;
  storage_location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string | null;
  code: string | null;
  name: string;
  description: string | null;
  sale_price: number;
  cost: number;
  sale_unit: UnitType;
  weight_per_unit: number | null;
  current_stock: number;
  min_stock: number;
  track_stock: boolean;
  image_url: string | null;
  is_active: boolean;
  is_sellable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
  unit: UnitType;
  waste_factor: number;
  notes: string | null;
  sort_order: number;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  entity_type: 'ingredient' | 'product';
  entity_id: string;
  movement_type: MovementType;
  quantity_base: number;
  unit_cost: number | null;
  total_cost: number;
  reason: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  user_id: string;
  batch_number: string | null;
  expiry_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================
// VENTAS
// =============================================
export interface Sale {
  id: string;
  tenant_id: string;
  ticket_number: number;
  ticket_prefix: string;
  customer_id: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  cashier_id: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_pct: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

// =============================================
// CIERRES DE CAJA
// =============================================
export interface CashClosing {
  id: string;
  tenant_id: string;
  user_id: string;
  date: string;
  shift: string | null;
  expected_cash: number;
  expected_card: number;
  expected_other: number;
  expected_total: number;
  counted_cash: number | null;
  counted_card: number | null;
  counted_other: number | null;
  counted_total: number;
  diff_cash: number;
  diff_card: number;
  diff_other: number;
  diff_total: number;
  status: ClosingStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashMovement {
  id: string;
  tenant_id: string;
  cash_closing_id: string | null;
  type: CashMovementType;
  amount: number;
  reason: string;
  reference_type: ReferenceType | null;
  reference_id: string | null;
  user_id: string;
  created_at: string;
}

// =============================================
// CLIENTES Y PEDIDOS
// =============================================
export interface Customer {
  id: string;
  tenant_id: string;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  birthday: string | null;
  loyalty_points: number;
  total_spent: number;
  orders_count: number;
  tags: string[];
  preferred_products: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: number;
  customer_id: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  delivery_date: string | null;
  delivery_address: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  assigned_to: string | null;
  created_by: string;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_pct: number;
  tax_rate: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

// =============================================
// VIEWS / COMPOSITE TYPES (para queries complejas)
// =============================================

export interface IngredientWithCategory extends Ingredient {
  category: Category | null;
  supplier: Supplier | null;
  stock_status: 'ok' | 'low' | 'critical' | 'out';
}

export interface ProductWithCategory extends Product {
  category: Category | null;
  ingredients: ProductIngredientWithDetails[];
  stock_status: 'ok' | 'low' | 'critical' | 'out' | 'not_tracked';
  margin: number;
  margin_percent: number;
}

export interface ProductIngredientWithDetails extends ProductIngredient {
  ingredient: Ingredient;
  cost_contribution: number;
}

export interface StockMovementWithDetails extends StockMovement {
  user: User;
  entity_name: string;
}

export interface DashboardKPIs {
  total_ingredients: number;
  low_stock_ingredients: number;
  out_of_stock_ingredients: number;
  total_products: number;
  low_stock_products: number;
  inventory_value: number;
  today_sales: number;
  today_production_orders: number;
  pending_orders: number;
}

// =============================================
// INSERT / UPDATE TYPES (sin campos auto-generados)
// =============================================

export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
export type TenantUpdate = Partial<TenantInsert>;

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>;
export type UserUpdate = Partial<UserInsert>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<CategoryInsert>;

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type SupplierUpdate = Partial<SupplierInsert>;

export type IngredientInsert = Omit<Ingredient, 'id' | 'created_at' | 'updated_at' | 'current_stock'>;
export type IngredientUpdate = Partial<IngredientInsert>;

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'cost' | 'current_stock'>;
export type ProductUpdate = Partial<ProductInsert>;

export type ProductIngredientInsert = Omit<ProductIngredient, 'id'>;
export type ProductIngredientUpdate = Partial<ProductIngredientInsert>;

export type StockMovementInsert = Omit<StockMovement, 'id' | 'total_cost' | 'created_at'>;
export type StockMovementUpdate = never; // Inmutable

// Ventas
export type SaleInsert = Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'closed_at'>;
export type SaleUpdate = Partial<SaleInsert> & { closed_at?: string };

export type SaleItemInsert = Omit<SaleItem, 'id' | 'created_at' | 'discount_amount' | 'tax_amount' | 'total'>;
export type SaleItemUpdate = Partial<SaleItemInsert>;

export type SalePaymentInsert = Omit<SalePayment, 'id' | 'created_at'>;
export type SalePaymentUpdate = Partial<SalePaymentInsert>;

// Cierres de caja
export type CashClosingInsert = Omit<CashClosing, 'id' | 'created_at' | 'updated_at' | 'counted_total' | 'diff_cash' | 'diff_card' | 'diff_other' | 'diff_total'>;
export type CashClosingUpdate = Partial<CashClosingInsert>;

export type CashMovementInsert = Omit<CashMovement, 'id' | 'created_at'>;
export type CashMovementUpdate = Partial<CashMovementInsert>;

// Clientes
export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'loyalty_points' | 'total_spent' | 'orders_count'>;
export type CustomerUpdate = Partial<CustomerInsert>;

// Pedidos
export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'confirmed_at' | 'completed_at'>;
export type OrderUpdate = Partial<OrderInsert>;

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>;
export type OrderItemUpdate = Partial<OrderItemInsert>;

// =============================================
// DATABASE SCHEMA (para supabase client)
// =============================================

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: TenantInsert;
        Update: TenantUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      suppliers: {
        Row: Supplier;
        Insert: SupplierInsert;
        Update: SupplierUpdate;
      };
      ingredients: {
        Row: Ingredient;
        Insert: IngredientInsert;
        Update: IngredientUpdate;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_ingredients: {
        Row: ProductIngredient;
        Insert: ProductIngredientInsert;
        Update: ProductIngredientUpdate;
      };
      stock_movements: {
        Row: StockMovement;
        Insert: StockMovementInsert;
        Update: StockMovementUpdate;
      };
      sales: {
        Row: Sale;
        Insert: SaleInsert;
        Update: SaleUpdate;
      };
      sale_items: {
        Row: SaleItem;
        Insert: SaleItemInsert;
        Update: SaleItemUpdate;
      };
      sale_payments: {
        Row: SalePayment;
        Insert: SalePaymentInsert;
        Update: SalePaymentUpdate;
      };
      cash_closings: {
        Row: CashClosing;
        Insert: CashClosingInsert;
        Update: CashClosingUpdate;
      };
      cash_movements: {
        Row: CashMovement;
        Insert: CashMovementInsert;
        Update: CashMovementUpdate;
      };
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
      };
    };
    Views: {
      // Vistas que se pueden crear después
    };
    Functions: {
      get_entity_base_unit: {
        Args: { p_entity_type: 'ingredient' | 'product'; p_entity_id: string };
        Returns: UnitType;
      };
      get_entity_current_stock: {
        Args: { p_entity_type: 'ingredient' | 'product'; p_entity_id: string };
        Returns: number | null;
      };
      validate_entity_tenant: {
        Args: { p_tenant_id: string; p_entity_type: 'ingredient' | 'product'; p_entity_id: string };
        Returns: boolean;
      };
      current_user_tenant_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      // Ventas
      calculate_expected_closing: {
        Args: { p_date: string; p_shift?: string; p_user_id?: string };
        Returns: Record<string, unknown>;
      };
      create_cash_closing: {
        Args: { p_date: string; p_shift: string; p_counted_cash: number; p_counted_card: number; p_counted_other: number; p_notes?: string };
        Returns: string;
      };
      // Clientes
      search_customers: {
        Args: { p_query: string; p_limit: number };
        Returns: Customer[];
      };
      quick_create_customer: {
        Args: { p_name: string; p_phone?: string; p_email?: string };
        Returns: Customer;
      };
    };
    Enums: {
      user_role: UserRole;
      category_type: CategoryType;
      unit_type: UnitType;
      movement_type: MovementType;
      reference_type: ReferenceType;
      payment_method: PaymentMethod;
      sale_status: SaleStatus;
      closing_status: ClosingStatus;
      cash_movement_type: CashMovementType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
    };
  };
}