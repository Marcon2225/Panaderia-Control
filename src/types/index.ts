// Tipos principales para Panadería Control

// ============ INVENTARIO ============
export interface IIngredient {
  id: string;
  name: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'unidad';
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  cost: number;
  margin: number;
  ingredients: IProductIngredient[];
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'pan'
  | 'bolleria'
  | 'pasteleria'
  | 'salado'
  | 'bebida'
  | 'otro';

export interface IProductIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
}

export interface IStockMovement {
  id: string;
  ingredientId: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'merma';
  quantity: number;
  reason: string;
  referenceId?: string; // ID de venta, producción, pedido, etc.
  userId: string;
  createdAt: string;
}

// ============ VENTAS ============
export interface ISale {
  id: string;
  ticketNumber: number;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  customerId?: string;
  cashierId: string;
  createdAt: string;
  closedAt?: string;
}

export interface ISaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

export type SaleStatus = 'abierta' | 'pagada' | 'cancelada' | 'pendiente';

// ============ PRODUCCIÓN ============
export interface IRecipe {
  id: string;
  name: string;
  productId: string;
  yield: number; // cantidad que produce
  yieldUnit: string;
  ingredients: IRecipeIngredient[];
  steps: string[];
  prepTime: number; // minutos
  bakeTime?: number; // minutos
  restTime?: number; // minutos
  difficulty: 'facil' | 'media' | 'dificil';
  costPerUnit: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IRecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface IProductionOrder {
  id: string;
  recipeId: string;
  recipeName: string;
  quantity: number;
  status: ProductionStatus;
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  waste?: number; // merma en unidades
  createdAt: string;
  updatedAt: string;
}

export type ProductionStatus =
  | 'planificada'
  | 'en_progreso'
  | 'completada'
  | 'cancelada'
  | 'en_horno'
  | 'enfriando';

// ============ CLIENTES ============
export interface ICustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  ordersCount: number;
  favoriteProducts: string[]; // product IDs
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  id: string;
  customerId: string;
  customerName: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  deliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

// ============ DASHBOARD / REPORTES ============
export interface IKPI {
  label: string;
  value: string | number;
  trend?: number; // porcentaje de cambio
  trendLabel?: string;
  icon: string;
  color: 'bakery' | 'green' | 'blue' | 'amber' | 'red';
}

export interface IChartDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface IDashboardStats {
  todaySales: number;
  todayOrders: number;
  todayProduction: number;
  lowStockCount: number;
  avgTicket: number;
  topProducts: ITopProduct[];
  salesByHour: IChartDataPoint[];
  productionStatus: IProductionStatusCount[];
}

export interface ITopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface IProductionStatusCount {
  status: ProductionStatus;
  count: number;
}

// ============ USUARIOS / AUTH (futuro) ============
export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'gerente' | 'vendedor' | 'panadero' | 'repartidor';

// ============ CONFIGURACIÓN ============
export interface IBusinessConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  currency: string;
  timezone: string;
  openingHours: IOpeningHours;
  taxRate: number;
  ticketPrefix: string;
}

export interface IOpeningHours {
  monday: IDaySchedule;
  tuesday: IDaySchedule;
  wednesday: IDaySchedule;
  thursday: IDaySchedule;
  friday: IDaySchedule;
  saturday: IDaySchedule;
  sunday: IDaySchedule;
}

export interface IDaySchedule {
  isOpen: boolean;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}