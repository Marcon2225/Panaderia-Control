'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Eye,
  X,
  Check,
  ChevronDown,
  Filter,
  UserPlus,
  Package,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useSales, useActiveSale, type POSCartItem } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useSales';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { showSuccess, showError } from '../components/ui/Toast';

// ============================================
// COMPONENTE: CARRITO POS (Sidebar derecho)
// ============================================
function POSCart({
  sale,
  items,
  products,
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onCustomerChange,
  customer,
  onPaymentMethodChange,
  paymentMethod,
  payments,
  onAddPayment,
  onRemovePayment,
  onFinalize,
  onCancel,
  loading,
}: {
  sale: { id: string; subtotal: number; tax_amount: number; total: number } | null;
  items: POSCartItem[];
  products: { id: string; name: string; price: number; cost: number; category: { name: string } | null; tax_rate?: number }[];
  onAddItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClear: () => void;
  onCustomerChange: (customerId: string | undefined) => void;
  customer: { id: string; name: string } | null;
  onPaymentMethodChange: (method: 'efectivo' | 'tarjeta' | 'mixto' | 'transferencia') => void;
  paymentMethod: string;
  payments: { payment_method: string; amount: number }[];
  onAddPayment: (method: string, amount: number) => void;
  onRemovePayment: (index: number) => void;
  onFinalize: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, (sale?.total ?? 0) - paidTotal);
  const canFinalize = items.length > 0 && remaining <= 0.01;

  return (
    <Card className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto flex flex-col">
      <CardHeader className="border-b border-bakery-100 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-bakery-900">Ticket actual</h2>
          {sale && (
            <Badge variant="warning" size="sm">#{sale.id.slice(-6).toUpperCase()}</Badge>
          )}
        </div>
      </CardHeader>

      <CardBody className="flex-1 p-3 space-y-4 overflow-y-auto">
        {/* Cliente */}
        <div>
          <label className="label">Cliente</label>
          <CustomerSelector
            value={customer?.id}
            onChange={onCustomerChange}
            placeholder="Cliente ocasional"
          />
        </div>

        {/* Buscador de productos */}
        <div>
          <label className="label">Añadir producto</label>
          <ProductSearch products={products} onSelect={onAddItem} />
        </div>

        {/* Líneas del ticket */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-bakery-400">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ticket vacío</p>
              <p className="text-xs">Busca o escanea un producto</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="p-3 bg-bakery-50 rounded-lg border border-bakery-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-bakery-900 truncate">{item.productName}</p>
                    <p className="text-xs text-bakery-500">
                      {formatCurrency(item.price)} × {item.quantity}
                      {item.discountPct > 0 && <span className="ml-2 text-amber-600">- {item.discountPct}%</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-bakery-200 rounded">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="px-2 py-1 text-bakery-600 hover:bg-bakery-100"
                        aria-label="Disminuir"
                      >−</button>
                      <span className="w-10 text-center font-mono text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="px-2 py-1 text-bakery-600 hover:bg-bakery-100"
                        aria-label="Aumentar"
                      >+</button>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.productId)}
                      className="p-1.5 text-bakery-400 hover:text-red-600 hover:bg-red-50 rounded"
                      aria-label="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <span className="font-mono font-medium text-bakery-900">
                    {formatCurrency(item.price * item.quantity * (1 - item.discountPct / 100))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full" onClick={onClear}>
            <X className="w-4 h-4 mr-1" /> Vaciar ticket
          </Button>
        )}

        {/* Totales */}
        {sale && (
          <div className="border-t border-bakery-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-bakery-600">Subtotal</span>
              <span className="font-medium text-bakery-900">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-bakery-600">IVA (21%)</span>
              <span className="font-medium text-bakery-900">{formatCurrency(sale.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-bakery-200 pt-2">
              <span className="text-bakery-900">TOTAL</span>
              <span className="text-bakery-900">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        )}

        {/* Pagos */}
        <div className="border-t border-bakery-100 pt-3 space-y-3">
          <h3 className="text-sm font-medium text-bakery-700">Pagos</h3>

          <div className="grid grid-cols-2 gap-2">
            {(['efectivo', 'tarjeta', 'mixto', 'transferencia'] as const).map((method) => (
              <button
                key={method}
                onClick={() => onPaymentMethodChange(method)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentMethod === method
                    ? 'bg-bakery-600 text-white'
                    : 'bg-bakery-50 text-bakery-700 hover:bg-bakery-100'
                }`}
              >
                {method === 'efectivo' && <DollarSign className="w-5 h-5 mx-auto mb-1" />}
                {method === 'tarjeta' && <CreditCard className="w-5 h-5 mx-auto mb-1" />}
                {method === 'mixto' && <span className="text-lg">💳💵</span>}
                {method === 'transferencia' && <span className="text-lg">📱</span>}
                <span className="block capitalize">{method}</span>
              </button>
            ))}
          </div>

          {paymentMethod === 'mixto' ? (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Efectivo"
                value={payments.find(p => p.payment_method === 'efectivo')?.amount ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onAddPayment('efectivo', val);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Tarjeta"
                value={payments.find(p => p.payment_method === 'tarjeta')?.amount ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onAddPayment('tarjeta', val);
                }}
              />
            </div>
          ) : (
            <Input
              type="number"
              step="0.01"
              placeholder={`Importe en ${paymentMethod}`}
              value={payments.find(p => p.payment_method === paymentMethod)?.amount ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onAddPayment(paymentMethod, val);
              }}
            />
          )}

          {/* Pagos añadidos */}
          {payments.length > 0 && (
            <div className="space-y-1">
              {payments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-bakery-50 rounded">
                  <span className="text-sm text-bakery-700 capitalize">{payment.payment_method}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-bakery-900">{formatCurrency(payment.amount)}</span>
                    <button
                      onClick={() => onRemovePayment(index)}
                      className="p-1 text-bakery-400 hover:text-red-600"
                      aria-label="Eliminar pago"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pendiente / Cambio */}
          <div className={`p-3 rounded-lg font-mono text-lg ${remaining > 0.01 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
            <div className="flex justify-between">
              <span>{remaining > 0.01 ? 'Pendiente' : 'Cambio'}</span>
              <span>{formatCurrency(remaining > 0.01 ? remaining : Math.abs(remaining))}</span>
            </div>
          </div>
        </div>

        {/* Acciones finales */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-bakery-100">
          <Button
            variant="secondary"
            className="h-12"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button
            variant="primary"
            className="h-12"
            onClick={onFinalize}
            disabled={loading || !canFinalize}
          >
            <Check className="w-4 h-4 mr-1" /> Cobrar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================
// COMPONENTE: SELECTOR DE CLIENTE
// ============================================
function CustomerSelector({
  value,
  onChange,
  placeholder,
}: {
  value: string | undefined;
  onChange: (customerId: string | undefined) => void;
  placeholder: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { search, customers, loading } = useCustomers();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      search(searchQuery);
    } else if (searchQuery === '') {
      // Mostrar clientes recientes
    }
  }, [searchQuery, search]);

  const allCustomers = searchQuery ? customers : customers.slice(0, 5);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={() => setShowDropdown(!showDropdown)}
        className="justify-between text-left"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        rightIcon={<ChevronDown className="w-4 h-4 text-bakery-400" />}
      >
        <span className={value ? '' : 'text-bakery-400'}>
          {value
            ? customers.find(c => c.id === value)?.name ?? 'Cliente seleccionado'
            : placeholder}
        </span>
      </Button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border shadow-elevated max-h-60 overflow-hidden">
          <div className="p-2 border-b border-bakery-100">
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="pl-10"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-bakery-400">Buscando...</div>
            ) : allCustomers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-bakery-400 text-sm">No se encontraron clientes</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => onChange(undefined)}>
                  <UserPlus className="w-3 h-3 mr-1" /> Cliente ocasional
                </Button>
              </div>
            ) : (
              allCustomers.map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => { onChange(cust.id); setShowDropdown(false); }}
                  className={`w-full p-3 text-left hover:bg-bakery-50 transition-colors ${
                    value === cust.id ? 'bg-bakery-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-bakery-100 flex items-center justify-center">
                        <span className="text-bakery-700 font-medium text-sm">
                          {cust.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-bakery-900">{cust.name}</p>
                        <p className="text-xs text-bakery-500">
                          {cust.phone ?? cust.email ?? 'Sin contacto'}
                        </p>
                      </div>
                    </div>
                    {value === cust.id && <Check className="w-4 h-4 text-bakery-600" />}
                  </div>
                </button>
              )))}
          </div>
          <div className="p-2 border-t border-bakery-100">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { onChange(undefined); setShowDropdown(false); }}>
              <UserPlus className="w-3 h-3 mr-1" /> Cliente ocasional
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: BUSCADOR DE PRODUCTOS
// ============================================
function ProductSearch({
  products,
  onSelect,
}: {
  products: { id: string; name: string; price: number; cost: number; category: { name: string } | null; tax_rate?: number }[];
  onSelect: (productId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="relative">
      <Input
        placeholder="Escribe nombre o código..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        leftIcon={<Search className="w-4 h-4" />}
      />
      {showResults && query && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl border shadow-elevated max-h-60 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-bakery-400 text-sm">Sin resultados</div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { onSelect(product.id); setQuery(''); setShowResults(false); }}
                  className="w-full p-3 text-left hover:bg-bakery-50 transition-colors border-b border-bakery-100 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-bakery-900">{product.name}</p>
                      <p className="text-xs text-bakery-500 capitalize">{product.category?.name ?? 'otro'}</p>
                    </div>
                    <span className="font-mono font-medium text-bakery-900">{formatCurrency(product.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL: VENTAS
// ============================================
export function Sales() {
  // Estado del POS
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'mixto' | 'transferencia'>('efectivo');
  const [payments, setPayments] = useState<{ payment_method: string; amount: number }[]>([]);
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Hooks
  const {
    activeSale,
    setActiveSale,
    ensureActiveSale,
    createSale,
    addSaleItem,
    updateSaleItem,
    removeSaleItem,
    addPayment: addPaymentToSale,
    finalizeSale,
    cancelSale,
    loading: saleLoading,
  } = useActiveSale();

  const { products, loading: productsLoading } = useProducts({ sellableOnly: true });
  const { customers } = useCustomers();

  const { sales: historySales } = useSales({
    status: 'pagada',
    limit: 20,
  });

  // Inicializar carrito activo
  useEffect(() => {
    ensureActiveSale();
  }, [ensureActiveSale]);

  // Sincronizar carrito con venta activa
  useEffect(() => {
    if (activeSale?.items) {
      const items: POSCartItem[] = activeSale.items.map(item => ({
        productId: item.product_id,
        productName: item.product?.name ?? 'Producto',
        category: item.product?.category ?? '',
        price: Number(item.unit_price),
        cost: Number(item.unit_cost),
        quantity: Number(item.quantity),
        discountPct: Number(item.discount_pct),
        taxRate: Number(item.tax_rate),
      }));
      setCartItems(items);
    }
  }, [activeSale]);

  // Calcular totales del carrito
  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity * (1 - item.discountPct / 100), 0),
    [cartItems]
  );
  const taxAmount = useMemo(() =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity * (1 - item.discountPct / 100) * (item.taxRate / 100), 0),
    [cartItems]
  );
  const total = subtotal + taxAmount;
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - paidTotal);
  const canFinalize = cartItems.length > 0 && remaining <= 0.01;

  // Acciones del carrito
  const handleAddItem = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const categoryName = product.category?.name ?? 'otro';
    const defaultTaxRate = 21; // IVA por defecto

    // Verificar si ya está en el carrito
    const existingIndex = cartItems.findIndex(i => i.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 };
      setCartItems(newItems);

      if (activeSale) {
        await updateSaleItem(
          activeSale.items[existingIndex].id,
          { quantity: newItems[existingIndex].quantity }
        );
      }
    } else {
      const newItem: POSCartItem = {
        productId: product.id,
        productName: product.name,
        category: categoryName,
        price: product.sale_price,
        cost: product.cost,
        quantity: 1,
        discountPct: 0,
        taxRate: defaultTaxRate,
      };
      setCartItems([...cartItems, newItem]);

      if (activeSale) {
        await addSaleItem(activeSale.id, {
          productId: product.id,
          quantity: 1,
          unitPrice: product.sale_price,
          unitCost: product.cost,
          discountPct: 0,
          taxRate: defaultTaxRate,
        });
      } else {
        // Crear venta nueva si no existe
        const { data: newSale } = await createSale({ customerId: customer?.id });
        if (newSale) {
          await addSaleItem(newSale.id, {
            productId: product.id,
            quantity: 1,
            unitPrice: product.sale_price,
            unitCost: product.cost,
            discountPct: 0,
            taxRate: defaultTaxRate,
          });
        }
      }
    }
  }, [cartItems, products, activeSale, customer?.id, createSale, addSaleItem, updateSaleItem]);

  const handleUpdateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    const newItems = cartItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCartItems(newItems);

    if (activeSale) {
      const saleItem = activeSale.items.find(i => i.product_id === productId);
      if (saleItem) {
        await updateSaleItem(saleItem.id, { quantity });
      }
    }
  }, [cartItems, activeSale, updateSaleItem]);

  const handleRemoveItem = useCallback(async (productId: string) => {
    const newItems = cartItems.filter(item => item.productId !== productId);
    setCartItems(newItems);

    if (activeSale) {
      const saleItem = activeSale.items.find(i => i.product_id === productId);
      if (saleItem) {
        await removeSaleItem(saleItem.id);
      }
    }
  }, [cartItems, activeSale, removeSaleItem]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setPayments([]);
    setCustomer(null);
    if (activeSale) {
      cancelSale(activeSale.id);
      setActiveSale(null);
    }
  }, [activeSale, cancelSale, setActiveSale]);

  const handleCustomerChange = useCallback((customerId: string | undefined) => {
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      setCustomer(cust ? { id: cust.id, name: cust.name } : null);
    } else {
      setCustomer(null);
    }
    if (activeSale) {
      // Actualizar cliente en venta
    }
  }, [customers, activeSale]);

  const handlePaymentMethodChange = useCallback((method: typeof paymentMethod) => {
    setPaymentMethod(method);
    // Limpiar pagos al cambiar método
    if (method !== 'mixto') {
      setPayments([]);
    }
  }, []);

  const handleAddPayment = useCallback((method: string, amount: number) => {
    if (amount <= 0) {
      setPayments(p => p.filter(p => p.payment_method !== method));
      return;
    }
    setPayments(prev => {
      const existing = prev.findIndex(p => p.payment_method === method);
      if (existing >= 0) {
        const newPayments = [...prev];
        newPayments[existing] = { ...newPayments[existing], amount };
        return newPayments;
      }
      return [...prev, { payment_method: method, amount }];
    });
  }, []);

  const handleRemovePayment = useCallback((index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleFinalize = useCallback(async () => {
    if (!activeSale || !canFinalize) return;

    // Añadir pagos a la venta
    for (const payment of payments) {
      await addPaymentToSale(activeSale.id, {
        paymentMethod: payment.payment_method as any,
        amount: payment.amount,
      });
    }

    // Finalizar venta
    const { error } = await finalizeSale(activeSale.id);
    if (error) {
      showError(error.message);
      return;
    }

    showSuccess('Venta completada', {
      action: { label: 'Ver ticket', onClick: () => {} },
    });

    // Limpiar carrito
    setCartItems([]);
    setPayments([]);
    setCustomer(null);
    setActiveSale(null);
  }, [activeSale, canFinalize, payments, addPaymentToSale, finalizeSale, setActiveSale]);

  const handleCancel = useCallback(async () => {
    if (activeSale) {
      await cancelSale(activeSale.id);
      setActiveSale(null);
    }
    setCartItems([]);
    setPayments([]);
    setCustomer(null);
  }, [activeSale, cancelSale, setActiveSale]);

  // Toggle vista histórico
  const toggleHistory = () => setShowHistory(!showHistory);

  if (productsLoading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-bakery-200 border-t-bakery-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Punto de Venta</h1>
          <p className="text-bakery-500 mt-1">Nueva venta y histórico de tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />} onClick={toggleHistory}>
            {showHistory ? 'POS' : 'Histórico'}
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={handleClearCart} disabled={cartItems.length === 0 && !activeSale}>
            Nuevo ticket
          </Button>
        </div>
      </div>

      {showHistory ? (
        /* ============================================
           VISTA HISTÓRICO DE VENTAS
           ============================================ */
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-bakery-900">Ventas del día</h2>
              <Badge variant="info" size="sm">{historySales.length} tickets</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Método pago</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {historySales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono font-medium">#{sale.ticket_number.toString().padStart(4, '0')}</td>
                      <td className="text-bakery-600">{formatDateTime(sale.opened_at)}</td>
                      <td>{sale.customer?.name ?? 'Ocasional'}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="neutral" size="sm">
                              {item.product?.name ?? 'Producto'} x{item.quantity}
                            </Badge>
                          ))}
                          {sale.items.length > 2 && (
                            <Badge variant="neutral" size="sm">+{sale.items.length - 2} más</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge variant={sale.payment_method === 'efectivo' ? 'success' : sale.payment_method === 'tarjeta' ? 'info' : 'warning'} size="sm">
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td className="text-right font-mono font-medium text-bakery-900">{formatCurrency(sale.total)}</td>
                      <td>
                        <Badge variant={sale.status === 'pagada' ? 'success' : 'danger'} size="sm">
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" className="p-1.5" aria-label="Ver ticket">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {historySales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-bakery-400">
                        <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No hay ventas hoy</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        /* ============================================
           VISTA POS (CARRITO + PRODUCTOS)
           ============================================ */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel izquierdo: Productos */}
          <div className="lg:col-span-3 space-y-6">
            {/* Categorías rápidas */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-bakery-900">Productos</h2>
              </CardHeader>
              <CardBody className="p-0">
                <ProductGrid products={products} onAddItem={handleAddItem} />
              </CardBody>
            </Card>
          </div>

          {/* Panel derecho: Carrito POS */}
          <POSCart
            sale={activeSale ? { id: activeSale.id, subtotal, tax_amount: taxAmount, total } : null}
            items={cartItems}
            products={products.map(p => ({
              id: p.id,
              name: p.name,
              price: p.sale_price,
              cost: p.cost,
              category: p.category ? { name: p.category.name } : null,
              tax_rate: 21, // IVA por defecto (no hay tax_rate en producto)
            }))}
            onAddItem={handleAddItem}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClear={handleClearCart}
            onCustomerChange={handleCustomerChange}
            customer={customer}
            onPaymentMethodChange={handlePaymentMethodChange}
            paymentMethod={paymentMethod}
            payments={payments}
            onAddPayment={handleAddPayment}
            onRemovePayment={handleRemovePayment}
            onFinalize={handleFinalize}
            onCancel={handleCancel}
            loading={saleLoading}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: GRID DE PRODUCTOS
// ============================================
function ProductGrid({
  products,
  onAddItem,
}: {
  products: { id: string; name: string; category: { name: string } | null; sale_price: number; is_active: boolean }[];
  onAddItem: (productId: string) => void;
}) {
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
    return ['todos', ...cats] as string[];
  }, [products]);

  const [activeCategory, setActiveCategory] = useState('todos');

  const filteredProducts = activeCategory === 'todos'
    ? products.filter(p => p.is_active)
    : products.filter(p => p.category?.name === activeCategory && p.is_active);

  return (
    <div>
      {/* Tabs de categorías */}
      <div className="border-b border-bakery-100 px-4 overflow-x-auto">
        <nav className="flex gap-1 pb-px" aria-label="Categorías de productos">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'border-bakery-600 text-bakery-900'
                  : 'border-transparent text-bakery-500 hover:text-bakery-700 hover:bg-bakery-50'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Grid de productos */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-bakery-400">
            <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium text-bakery-600">No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddItem(product.id)}
                className="p-3 rounded-xl border border-bakery-100 hover:bg-bakery-50 hover:border-bakery-200 transition-all text-left group"
              >
                <div className="font-medium text-bakery-900 text-sm truncate">{product.name}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-bakery-500 capitalize">{product.category?.name ?? 'otro'}</span>
                  <span className="font-mono font-semibold text-bakery-900 group-hover:text-bakery-600">
                    {formatCurrency(product.sale_price)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}