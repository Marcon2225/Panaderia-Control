// Datos mock para desarrollo - Panadería Control

import type {
  IIngredient, IProduct, IStockMovement, ISale,
  IRecipe, IProductionOrder, ICustomer, IOrder, IDashboardStats,
  IBusinessConfig
} from '../types';

// ============ INGREDIENTES ============
export const MOCK_INGREDIENTS: IIngredient[] = [
  {
    id: 'ing-1',
    name: 'Harina de trigo 000',
    unit: 'kg',
    currentStock: 45,
    minStock: 20,
    maxStock: 100,
    costPerUnit: 1.20,
    supplier: 'Molino San José',
    lastRestocked: '2026-11-10',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-10',
  },
  {
    id: 'ing-2',
    name: 'Harina integral',
    unit: 'kg',
    currentStock: 12,
    minStock: 10,
    maxStock: 50,
    costPerUnit: 1.50,
    supplier: 'Molino San José',
    lastRestocked: '2026-11-05',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-05',
  },
  {
    id: 'ing-3',
    name: 'Levadura fresca',
    unit: 'kg',
    currentStock: 3,
    minStock: 5,
    maxStock: 20,
    costPerUnit: 8.00,
    supplier: 'Levapan',
    lastRestocked: '2026-11-12',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-12',
  },
  {
    id: 'ing-4',
    name: 'Sal marina',
    unit: 'kg',
    currentStock: 8,
    minStock: 3,
    maxStock: 25,
    costPerUnit: 0.80,
    supplier: 'Salinas del Sur',
    lastRestocked: '2026-10-28',
    createdAt: '2026-01-15',
    updatedAt: '2026-10-28',
  },
  {
    id: 'ing-5',
    name: 'Azúcar blanca',
    unit: 'kg',
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    costPerUnit: 1.10,
    supplier: 'Azucarera Nacional',
    lastRestocked: '2026-11-08',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-08',
  },
  {
    id: 'ing-6',
    name: 'Mantequilla',
    unit: 'kg',
    currentStock: 6,
    minStock: 5,
    maxStock: 30,
    costPerUnit: 12.00,
    supplier: 'Lácteos El Prado',
    lastRestocked: '2026-11-11',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-11',
  },
  {
    id: 'ing-7',
    name: 'Huevos',
    unit: 'unidad',
    currentStock: 120,
    minStock: 60,
    maxStock: 300,
    costPerUnit: 0.25,
    supplier: 'Granja San Miguel',
    lastRestocked: '2026-11-12',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-12',
  },
  {
    id: 'ing-8',
    name: 'Leche entera',
    unit: 'l',
    currentStock: 15,
    minStock: 10,
    maxStock: 50,
    costPerUnit: 1.30,
    supplier: 'Lácteos El Prado',
    lastRestocked: '2026-11-12',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-12',
  },
  {
    id: 'ing-9',
    name: 'Chocolate cobertura 70%',
    unit: 'kg',
    currentStock: 2,
    minStock: 3,
    maxStock: 15,
    costPerUnit: 25.00,
    supplier: 'Cacao Premium',
    lastRestocked: '2026-11-01',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'ing-10',
    name: 'Dulce de leche',
    unit: 'kg',
    currentStock: 8,
    minStock: 5,
    maxStock: 20,
    costPerUnit: 6.50,
    supplier: 'Lácteos El Prado',
    lastRestocked: '2026-11-09',
    createdAt: '2026-01-15',
    updatedAt: '2026-11-09',
  },
];

// ============ PRODUCTOS ============
export const MOCK_PRODUCTS: IProduct[] = [
  {
    id: 'prod-1',
    name: 'Pan Baguette',
    description: 'Baguette tradicional francesa, crujiente por fuera y suave por dentro',
    category: 'pan',
    price: 1.50,
    cost: 0.45,
    margin: 70,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 0.3, unit: 'kg' },
      { ingredientId: 'ing-3', quantity: 0.005, unit: 'kg' },
      { ingredientId: 'ing-4', quantity: 0.006, unit: 'kg' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-2',
    name: 'Pan Integral',
    description: 'Pan 100% harina integral, alto en fibra',
    category: 'pan',
    price: 1.80,
    cost: 0.55,
    margin: 69,
    ingredients: [
      { ingredientId: 'ing-2', quantity: 0.35, unit: 'kg' },
      { ingredientId: 'ing-3', quantity: 0.006, unit: 'kg' },
      { ingredientId: 'ing-4', quantity: 0.007, unit: 'kg' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-3',
    name: 'Croissant Mantequilla',
    description: 'Croissant de mantequilla pura, hojaldrado artesanal',
    category: 'bolleria',
    price: 2.20,
    cost: 0.85,
    margin: 61,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-6', quantity: 0.08, unit: 'kg' },
      { ingredientId: 'ing-3', quantity: 0.01, unit: 'kg' },
      { ingredientId: 'ing-5', quantity: 0.02, unit: 'kg' },
      { ingredientId: 'ing-4', quantity: 0.003, unit: 'kg' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-4',
    name: 'Pain au Chocolat',
    description: 'Croissant relleno de chocolate negro 70%',
    category: 'bolleria',
    price: 2.50,
    cost: 1.10,
    margin: 56,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-6', quantity: 0.08, unit: 'kg' },
      { ingredientId: 'ing-9', quantity: 0.025, unit: 'kg' },
      { ingredientId: 'ing-3', quantity: 0.01, unit: 'kg' },
      { ingredientId: 'ing-5', quantity: 0.02, unit: 'kg' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-5',
    name: 'Ensalada César',
    description: 'Lechuga romana, pollo, parmesano, crutons y salsa César',
    category: 'salado',
    price: 6.50,
    cost: 2.80,
    margin: 57,
    ingredients: [],
    isActive: true,
    createdAt: '2026-03-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-6',
    name: 'Tarta de Santiago',
    description: 'Tarta tradicional gallega de almendra',
    category: 'pasteleria',
    price: 22.00,
    cost: 8.50,
    margin: 61,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 0.2, unit: 'kg' },
      { ingredientId: 'ing-5', quantity: 0.25, unit: 'kg' },
      { ingredientId: 'ing-6', quantity: 0.15, unit: 'kg' },
      { ingredientId: 'ing-7', quantity: 5, unit: 'unidad' },
    ],
    isActive: true,
    createdAt: '2026-02-01',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-7',
    name: 'Café Americano',
    description: 'Café de especialidad, tueste medio',
    category: 'bebida',
    price: 1.80,
    cost: 0.35,
    margin: 81,
    ingredients: [],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'prod-8',
    name: 'Medialuna de Grasa',
    description: 'Medialuna argentina tradicional, hojaldre de grasa',
    category: 'bolleria',
    price: 1.20,
    cost: 0.35,
    margin: 71,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 0.1, unit: 'kg' },
      { ingredientId: 'ing-6', quantity: 0.03, unit: 'kg' },
      { ingredientId: 'ing-3', quantity: 0.005, unit: 'kg' },
      { ingredientId: 'ing-5', quantity: 0.01, unit: 'kg' },
    ],
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
];

// ============ MOVIMIENTOS DE STOCK ============
export const MOCK_STOCK_MOVEMENTS: IStockMovement[] = [
  { id: 'mov-1', ingredientId: 'ing-1', type: 'entrada', quantity: 50, reason: 'Compra proveedor', referenceId: 'PO-20261110-001', userId: 'user-1', createdAt: '2026-11-10T08:30:00' },
  { id: 'mov-2', ingredientId: 'ing-3', type: 'entrada', quantity: 5, reason: 'Compra proveedor', referenceId: 'PO-20261112-001', userId: 'user-1', createdAt: '2026-11-12T07:00:00' },
  { id: 'mov-3', ingredientId: 'ing-1', type: 'salida', quantity: 15, reason: 'Producción pan baguette', referenceId: 'prod-ord-1', userId: 'user-2', createdAt: '2026-11-12T06:00:00' },
  { id: 'mov-4', ingredientId: 'ing-6', type: 'salida', quantity: 4, reason: 'Producción croissants', referenceId: 'prod-ord-2', userId: 'user-2', createdAt: '2026-11-12T05:30:00' },
  { id: 'mov-5', ingredientId: 'ing-9', type: 'ajuste', quantity: -0.5, reason: 'Merma por rotura envase', referenceId: '', userId: 'user-1', createdAt: '2026-11-11T14:00:00' },
];

// ============ VENTAS DE HOY ============
const today = new Date().toISOString().split('T')[0];

export const MOCK_SALES_TODAY: ISale[] = [
  {
    id: 'sale-1',
    ticketNumber: 1,
    items: [
      { productId: 'prod-1', productName: 'Pan Baguette', quantity: 2, unitPrice: 1.50, total: 3.00 },
      { productId: 'prod-3', productName: 'Croissant Mantequilla', quantity: 1, unitPrice: 2.20, total: 2.20 },
      { productId: 'prod-7', productName: 'Café Americano', quantity: 1, unitPrice: 1.80, total: 1.80 },
    ],
    subtotal: 7.00,
    tax: 1.47,
    total: 8.47,
    paymentMethod: 'efectivo',
    status: 'pagada',
    cashierId: 'user-3',
    createdAt: `${today}T07:15:00`,
    closedAt: `${today}T07:16:00`,
  },
  {
    id: 'sale-2',
    ticketNumber: 2,
    items: [
      { productId: 'prod-2', productName: 'Pan Integral', quantity: 1, unitPrice: 1.80, total: 1.80 },
      { productId: 'prod-8', productName: 'Medialuna de Grasa', quantity: 2, unitPrice: 1.20, total: 2.40 },
    ],
    subtotal: 4.20,
    tax: 0.88,
    total: 5.08,
    paymentMethod: 'tarjeta',
    status: 'pagada',
    cashierId: 'user-3',
    createdAt: `${today}T07:45:00`,
    closedAt: `${today}T07:46:00`,
  },
  {
    id: 'sale-3',
    ticketNumber: 3,
    items: [
      { productId: 'prod-1', productName: 'Pan Baguette', quantity: 3, unitPrice: 1.50, total: 4.50 },
      { productId: 'prod-4', productName: 'Pain au Chocolat', quantity: 2, unitPrice: 2.50, total: 5.00 },
      { productId: 'prod-7', productName: 'Café Americano', quantity: 2, unitPrice: 1.80, total: 3.60 },
    ],
    subtotal: 13.10,
    tax: 2.75,
    total: 15.85,
    paymentMethod: 'mixto',
    status: 'pagada',
    cashierId: 'user-3',
    createdAt: `${today}T08:20:00`,
    closedAt: `${today}T08:22:00`,
  },
];

// ============ RECETAS ============
export const MOCK_RECIPES: IRecipe[] = [
  {
    id: 'rec-1',
    name: 'Pan Baguette Tradicional',
    productId: 'prod-1',
    yield: 10,
    yieldUnit: 'unidades',
    ingredients: [
      { ingredientId: 'ing-1', quantity: 3, unit: 'kg', notes: 'Harina 000' },
      { ingredientId: 'ing-3', quantity: 0.05, unit: 'kg', notes: 'Levadura fresca' },
      { ingredientId: 'ing-4', quantity: 0.06, unit: 'kg', notes: 'Sal' },
      { ingredientId: 'ing-8', quantity: 1.8, unit: 'l', notes: 'Agua (no en stock)' },
    ],
    steps: [
      'Mezclar harina, levadura y sal en amasadora',
      'Añadir agua poco a poco',
      'Amasar 10 min velocidad baja, 5 min velocidad alta',
      'Reposo en bloque 45 min',
      'Dividir en piezas de 300g',
      'Preformar y reposo 15 min',
      'Formar baguettes finales',
      'Fermentación 60-75 min a 24°C',
      'Greñar y hornear 22 min a 240°C con vapor',
    ],
    prepTime: 30,
    bakeTime: 22,
    restTime: 120,
    difficulty: 'media',
    costPerUnit: 0.45,
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
  {
    id: 'rec-2',
    name: 'Croissant Mantequilla Artesanal',
    productId: 'prod-3',
    yield: 20,
    yieldUnit: 'unidades',
    ingredients: [
      { ingredientId: 'ing-1', quantity: 3, unit: 'kg' },
      { ingredientId: 'ing-6', quantity: 1.6, unit: 'kg', notes: 'Para laminado' },
      { ingredientId: 'ing-3', quantity: 0.2, unit: 'kg' },
      { ingredientId: 'ing-5', quantity: 0.4, unit: 'kg' },
      { ingredientId: 'ing-4', quantity: 0.06, unit: 'kg' },
      { ingredientId: 'ing-7', quantity: 4, unit: 'unidad' },
      { ingredientId: 'ing-8', quantity: 1.2, unit: 'l' },
    ],
    steps: [
      'Mezcla en bloque: harina, levadura, azúcar, sal, huevos, leche',
      'Amasar hasta desarrollo medio',
      'Estirar y refrigerar 2h',
      'Laminado: 3 vueltas simples con 30 min frío entre cada una',
      'Estirar a 3.5mm y cortar triángulos',
      'Formar croissants',
      'Fermentación 2.5-3h a 26°C',
      'Pintar con huevo',
      'Hornear 16-18 min a 190°C',
    ],
    prepTime: 45,
    bakeTime: 18,
    restTime: 210,
    difficulty: 'dificil',
    costPerUnit: 0.85,
    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-11-01',
  },
];

// ============ ÓRDENES DE PRODUCCIÓN ============
export const MOCK_PRODUCTION_ORDERS: IProductionOrder[] = [
  {
    id: 'prod-ord-1',
    recipeId: 'rec-1',
    recipeName: 'Pan Baguette Tradicional',
    quantity: 30,
    status: 'completada',
    scheduledFor: `${today}T05:00:00`,
    startedAt: `${today}T05:00:00`,
    completedAt: `${today}T07:30:00`,
    assignedTo: 'user-2',
    waste: 1,
    createdAt: '2026-11-11T16:00:00',
    updatedAt: `${today}T07:30:00`,
  },
  {
    id: 'prod-ord-2',
    recipeId: 'rec-2',
    recipeName: 'Croissant Mantequilla Artesanal',
    quantity: 40,
    status: 'en_horno',
    scheduledFor: `${today}T04:30:00`,
    startedAt: `${today}T04:30:00`,
    assignedTo: 'user-2',
    createdAt: '2026-11-11T16:00:00',
    updatedAt: `${today}T06:00:00`,
  },
  {
    id: 'prod-ord-3',
    recipeId: 'rec-1',
    recipeName: 'Pan Baguette Tradicional',
    quantity: 20,
    status: 'planificada',
    scheduledFor: `${today}T14:00:00`,
    assignedTo: 'user-2',
    createdAt: '2026-11-11T16:00:00',
    updatedAt: '2026-11-11T16:00:00',
  },
];

// ============ CLIENTES ============
export const MOCK_CUSTOMERS: ICustomer[] = [
  {
    id: 'cust-1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+34 600 123 456',
    address: 'Calle Mayor 15, 28001 Madrid',
    loyaltyPoints: 245,
    totalSpent: 187.50,
    ordersCount: 12,
    favoriteProducts: ['prod-1', 'prod-3'],
    tags: ['vip', 'tempranero'],
    isActive: true,
    createdAt: '2026-02-10',
    updatedAt: '2026-11-10',
  },
  {
    id: 'cust-2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@empresa.com',
    phone: '+34 611 222 333',
    address: 'Av. Diagonal 450, 08006 Barcelona',
    loyaltyPoints: 89,
    totalSpent: 67.20,
    ordersCount: 5,
    favoriteProducts: ['prod-2', 'prod-7'],
    tags: ['empresa', 'recurrente'],
    isActive: true,
    createdAt: '2026-05-15',
    updatedAt: '2026-11-08',
  },
];

// ============ PEDIDOS CLIENTES ============
export const MOCK_ORDERS: IOrder[] = [
  {
    id: 'ord-1',
    customerId: 'cust-1',
    customerName: 'María González',
    items: [
      { productId: 'prod-1', productName: 'Pan Baguette', quantity: 2, unitPrice: 1.50, total: 3.00 },
      { productId: 'prod-6', productName: 'Tarta de Santiago', quantity: 1, unitPrice: 22.00, total: 22.00 },
    ],
    subtotal: 25.00,
    tax: 5.25,
    total: 30.25,
    status: 'confirmado',
    deliveryDate: `${today}T12:00:00`,
    deliveryAddress: 'Calle Mayor 15, 28001 Madrid',
    notes: 'Para cumpleaños, cortar tarta en 8 porciones',
    createdAt: `${today}T09:00:00`,
    updatedAt: `${today}T09:15:00`,
  },
];

// ============ DASHBOARD STATS ============
export const MOCK_DASHBOARD_STATS: IDashboardStats = {
  todaySales: 29.40,
  todayOrders: 3,
  todayProduction: 70,
  lowStockCount: 3,
  avgTicket: 9.80,
  topProducts: [
    { productId: 'prod-1', name: 'Pan Baguette', quantity: 5, revenue: 7.50 },
    { productId: 'prod-3', name: 'Croissant Mantequilla', quantity: 1, revenue: 2.20 },
    { productId: 'prod-4', name: 'Pain au Chocolat', quantity: 2, revenue: 5.00 },
    { productId: 'prod-8', name: 'Medialuna de Grasa', quantity: 2, revenue: 2.40 },
  ],
  salesByHour: [
    { label: '07:00', value: 13.55 },
    { label: '08:00', value: 15.85 },
    { label: '09:00', value: 0 },
    { label: '10:00', value: 0 },
    { label: '11:00', value: 0 },
    { label: '12:00', value: 0 },
    { label: '13:00', value: 0 },
    { label: '14:00', value: 0 },
    { label: '15:00', value: 0 },
    { label: '16:00', value: 0 },
    { label: '17:00', value: 0 },
    { label: '18:00', value: 0 },
    { label: '19:00', value: 0 },
    { label: '20:00', value: 0 },
  ],
  productionStatus: [
    { status: 'completada', count: 1 },
    { status: 'en_horno', count: 1 },
    { status: 'planificada', count: 1 },
  ],
};

// ============ CONFIGURACIÓN NEGOCIO ============
export const MOCK_BUSINESS_CONFIG: IBusinessConfig = {
  name: 'Panadería Control',
  address: 'Calle del Pan 123, 28001 Madrid',
  phone: '+34 910 123 456',
  email: 'hola@panaderiacontrol.com',
  taxId: 'B12345678',
  currency: 'EUR',
  timezone: 'Europe/Madrid',
  openingHours: {
    monday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
    tuesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
    wednesday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
    thursday: { isOpen: true, openTime: '07:00', closeTime: '20:00' },
    friday: { isOpen: true, openTime: '07:00', closeTime: '21:00' },
    saturday: { isOpen: true, openTime: '07:30', closeTime: '14:00' },
    sunday: { isOpen: false, openTime: '08:00', closeTime: '14:00' },
  },
  taxRate: 21,
  ticketPrefix: 'TCK',
};

// ============ UTILIDADES ============
export const formatCurrency = (amount: number, currency = 'EUR'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
};

export const getStockStatus = (current: number, min: number, max: number): 'ok' | 'low' | 'critical' | 'overstock' => {
  if (current <= 0) return 'critical';
  if (current < min) return 'low';
  if (current > max) return 'overstock';
  return 'ok';
};

export const getStockStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ok: 'Normal',
    low: 'Bajo',
    critical: 'Crítico',
    overstock: 'Exceso',
  };
  return labels[status] || status;
};

export const getStockStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ok: 'badge-success',
    low: 'badge-warning',
    critical: 'badge-danger',
    overstock: 'badge-info',
  };
  return colors[status] || 'badge-neutral';
};