'use client';

import { Users, Plus, Mail, Phone, Star, MapPin, Award, Search, Eye, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MOCK_CUSTOMERS, MOCK_ORDERS } from '../constants/mockData';
import { formatCurrency } from '../utils/helpers';

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

export function Customers() {
  const activeCustomers = MOCK_CUSTOMERS.filter(c => c.isActive).length;
  const totalRevenue = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / MOCK_CUSTOMERS.reduce((sum, c) => sum + c.ordersCount, 0);
  const totalLoyaltyPoints = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.loyaltyPoints, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Clientes</h1>
          <p className="text-bakery-500 mt-1">CRM y fidelización</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
          Nuevo cliente
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSummary label="Clientes activos" value={activeCustomers} icon={<Users className="w-6 h-6" />} iconColor="#c87d4a" />
        <StatCardSummary label="Ingresos totales" value={formatCurrency(totalRevenue)} icon={<DollarSign className="w-6 h-6" />} iconColor="#22c55e" />
        <StatCardSummary label="Ticket medio" value={formatCurrency(avgOrderValue)} icon={<TrendingUp className="w-6 h-6" />} iconColor="#3b82f6" />
        <StatCardSummary label="Puntos fidelidad" value={totalLoyaltyPoints.toLocaleString('es-ES')} icon={<Award className="w-6 h-6" />} iconColor="#f59e0b" />
      </div>

      {/* Lista de clientes y pedidos recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clientes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-bakery-900">Clientes</h2>
              <Input placeholder="Buscar cliente..." leftIcon={<Search className="w-4 h-4" />} className="w-64" />
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th className="hidden md:table-cell">Contacto</th>
                    <th className="hidden lg:table-cell">Pedidos</th>
                    <th className="text-right hidden md:table-cell">Total gastado</th>
                    <th>Puntos</th>
                    <th>Etiquetas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CUSTOMERS.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-bakery-100 flex items-center justify-center">
                            <span className="text-bakery-700 font-medium text-sm">
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-bakery-900">{customer.name}</p>
                            <p className="text-xs text-bakery-500">Cliente desde {new Date(customer.createdAt).getFullYear()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-xs text-bakery-500">
                              <Mail className="w-3 h-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-xs text-bakery-500">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-center gap-1 text-xs text-bakery-500">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell text-bakery-600">{customer.ordersCount}</td>
                      <td className="text-right hidden md:table-cell font-mono font-medium text-bakery-900">
                        {formatCurrency(customer.totalSpent)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span className="font-medium text-bakery-900">{customer.loyaltyPoints}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.map((tag) => (
                            <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-right">
                        <Button variant="ghost" size="sm" className="p-1.5" aria-label="Ver cliente">
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

        {/* Pedidos recientes */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Pedidos recientes</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {MOCK_ORDERS.map((order) => (
                <div key={order.id} className="p-4 hover:bg-bakery-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-bakery-900">{order.customerName}</p>
                      <p className="text-sm text-bakery-500">{order.items.length} productos • {formatCurrency(order.total)}</p>
                    </div>
                    <Badge
                      variant={order.status === 'entregado' ? 'success' : order.status === 'confirmado' ? 'info' : order.status === 'en_preparacion' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-bakery-500 space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.productName} x{item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                    {order.deliveryDate && (
                      <div className="flex items-center gap-1 text-amber-600 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>Entrega: {new Date(order.deliveryDate).toLocaleString('es-ES')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}