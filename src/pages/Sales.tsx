'use client';

import { Plus, CreditCard, DollarSign, TrendingUp, Receipt, Search, Eye } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MOCK_SALES_TODAY, MOCK_PRODUCTS } from '../constants/mockData';
import { formatCurrency, formatDateTime } from '../utils/helpers';

function StatCardSummary({ label, value, icon, iconColor }: { label: string; value: string | number; icon: React.ReactNode; iconColor: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{typeof value === 'number' ? value.toLocaleString('es-ES') : value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${iconColor}15`, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function Sales() {
  const todaySales = MOCK_SALES_TODAY.reduce((sum, s) => sum + s.total, 0);
  const todayCount = MOCK_SALES_TODAY.length;
  const avgTicket = todayCount > 0 ? todaySales / todayCount : 0;
  const cashSales = MOCK_SALES_TODAY.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0);
  const cardSales = MOCK_SALES_TODAY.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Ventas</h1>
          <p className="text-bakery-500 mt-1">Punto de venta y histórico de tickets</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Nueva venta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSummary label="Ventas hoy" value={formatCurrency(todaySales)} icon={<DollarSign className="w-6 h-6" />} iconColor="#22c55e" />
        <StatCardSummary label="Tickets" value={todayCount} icon={<Receipt className="w-6 h-6" />} iconColor="#c87d4a" />
        <StatCardSummary label="Ticket medio" value={formatCurrency(avgTicket)} icon={<TrendingUp className="w-6 h-6" />} iconColor="#3b82f6" />
        <StatCardSummary label="Efectivo / Tarjeta" value={`${formatCurrency(cashSales)} / ${formatCurrency(cardSales)}`} icon={<CreditCard className="w-6 h-6" />} iconColor="#8b5cf6" />
      </div>

      {/* POS rápido y lista de ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POS simplificado */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Nueva venta rápida</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="label">Buscar producto</label>
              <Input placeholder="Escribe nombre o código..." leftIcon={<Search className="w-4 h-4" />} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {MOCK_PRODUCTS.slice(0, 6).map((product) => (
                <button
                  key={product.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-bakery-100 hover:bg-bakery-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-bakery-900 text-sm">{product.name}</p>
                    <p className="text-xs text-bakery-500">{formatCurrency(product.price)}</p>
                  </div>
                  <Button variant="secondary" size="sm">+</Button>
                </button>
              ))}
            </div>
            <div className="border-t border-bakery-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-bakery-600">Subtotal</span>
                <span className="font-medium text-bakery-900">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-bakery-600">IVA (21%)</span>
                <span className="font-medium text-bakery-900">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-bakery-900">Total</span>
                <span className="text-bakery-900">{formatCurrency(0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" className="py-3">Efectivo</Button>
                <Button variant="primary" className="py-3">Tarjeta</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Lista de ventas del día */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bakery-900">Ventas de hoy</h2>
              <Badge variant="info" size="sm">{todayCount} tickets</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Hora</th>
                    <th>Productos</th>
                    <th>Método pago</th>
                    <th className="text-right">Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SALES_TODAY.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-mono font-medium">#{sale.ticketNumber.toString().padStart(4, '0')}</td>
                      <td className="text-bakery-600">{formatDateTime(sale.createdAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="neutral" size="sm">{item.productName} x{item.quantity}</Badge>
                          ))}
                          {sale.items.length > 2 && <Badge variant="neutral" size="sm">+{sale.items.length - 2} más</Badge>}
                        </div>
                      </td>
                      <td>
                        <Badge variant={sale.paymentMethod === 'efectivo' ? 'success' : sale.paymentMethod === 'tarjeta' ? 'info' : 'warning'} size="sm">
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="text-right font-mono font-medium text-bakery-900">{formatCurrency(sale.total)}</td>
                      <td>
                        <Badge variant={sale.status === 'pagada' ? 'success' : sale.status === 'pendiente' ? 'warning' : 'danger'} size="sm">
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
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}