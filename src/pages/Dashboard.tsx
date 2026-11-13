'use client';

import { useMemo } from 'react';
import {
  ShoppingCart,
  Package,
  ChefHat,
  Users,
  AlertTriangle,
  Plus,
  DollarSign,
  Box,
  ClipboardList,
  Download,
} from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, QuickAction, ActivityItem } from '@/components/dashboard/StatCard';
import { LineChartComponent, BarChartComponent, PieChartComponent } from '@/components/charts/Charts';
import { MOCK_DASHBOARD_STATS, MOCK_INGREDIENTS, MOCK_PRODUCTION_ORDERS } from '@/constants/mockData';

export function Dashboard() {
  // Datos para gráficos
  const salesChartData = useMemo(() => MOCK_DASHBOARD_STATS.salesByHour, []);

  const topProductsData = useMemo(() =>
    MOCK_DASHBOARD_STATS.topProducts.map((p: typeof MOCK_DASHBOARD_STATS.topProducts[0]) => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
      value: p.revenue,
    })),
    []
  );

  const productionStatusData = useMemo(() =>
    MOCK_DASHBOARD_STATS.productionStatus.map((s: typeof MOCK_DASHBOARD_STATS.productionStatus[0]) => ({
      name: s.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      value: s.count,
      color: s.status === 'completada' ? '#22c55e' :
             s.status === 'en_horno' ? '#f59e0b' : '#3b82f6',
    })),
    []
  );

  const lowStockIngredients = MOCK_INGREDIENTS.filter((ing: typeof MOCK_INGREDIENTS[0]) => ing.currentStock <= ing.minStock);
  const pendingProduction = MOCK_PRODUCTION_ORDERS.filter((o: typeof MOCK_PRODUCTION_ORDERS[0]) => o.status !== 'completada' && o.status !== 'cancelada');
  // const recentSales = [...MOCK_SALES_TODAY].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const quickActions = [
    { label: 'Nueva venta', icon: <Plus className="w-5 h-5" />, variant: 'primary' as const, onClick: () => console.log('Nueva venta') },
    { label: 'Registrar producción', icon: <ClipboardList className="w-5 h-5" />, onClick: () => console.log('Producción') },
    { label: 'Nuevo pedido', icon: <Users className="w-5 h-5" />, onClick: () => console.log('Nuevo pedido') },
    { label: 'Ajuste inventario', icon: <Box className="w-5 h-5" />, onClick: () => console.log('Ajuste inventario') },
  ];

  const recentActivity = [
    { icon: <ShoppingCart className="w-5 h-5" />, iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Venta completada', description: 'Ticket #3 - 15,85€ (Efectivo + Tarjeta)', time: 'Hace 5 min' },
    { icon: <ChefHat className="w-5 h-5" />, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', title: 'Producción en horno', description: 'Croissants - 40 unidades (15 min restantes)', time: 'Hace 12 min', unread: true },
    { icon: <AlertTriangle className="w-5 h-5" />, iconBg: 'bg-red-100', iconColor: 'text-red-600', title: 'Stock bajo detectado', description: 'Levadura fresca: 3 kg (mín: 5 kg)', time: 'Hace 10 min', unread: true },
    { icon: <Package className="w-5 h-5" />, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Pedido proveedor recibido', description: 'Harina 000 - 50 kg (Molino San José)', time: 'Hace 2 horas' },
    { icon: <Users className="w-5 h-5" />, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', title: 'Nuevo cliente registrado', description: 'María González - Cliente VIP', time: 'Ayer' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Dashboard</h1>
          <p className="text-bakery-500 mt-1">Resumen de tu panadería para hoy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva venta
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ventas de hoy"
          value={formatCurrency(MOCK_DASHBOARD_STATS.todaySales)}
          icon={<DollarSign className="w-6 h-6" />}
          iconColor="#c87d4a"
          trend={12.5}
          trendLabel="vs ayer"
        />
        <StatCard
          label="Pedidos hoy"
          value={MOCK_DASHBOARD_STATS.todayOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          iconColor="#22c55e"
          trend={-2}
          trendLabel="vs ayer"
        />
        <StatCard
          label="Producción"
          value={`${MOCK_DASHBOARD_STATS.todayProduction} uds`}
          icon={<ChefHat className="w-6 h-6" />}
          iconColor="#f59e0b"
          trend={8.3}
          trendLabel="vs promedio"
        />
        <StatCard
          label="Stock bajo"
          value={MOCK_DASHBOARD_STATS.lowStockCount}
          icon={<AlertTriangle className="w-6 h-6" />}
          iconColor="#ef4444"
          trend={0}
          trendLabel="requieren atención"
        />
      </div>

      {/* Gráficos y acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por hora */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bakery-900">Ventas por hora</h2>
              <Badge variant="info" size="sm">Hoy</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <LineChartComponent
              data={salesChartData}
              xKey="label"
              yKeys={['value']}
              colors={['#c87d4a']}
              height={280}
              showArea={true}
              tooltipFormatter={(value: number) => [formatCurrency(value), 'Ventas']}
            />
          </CardBody>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Acciones rápidas</h2>
          </CardHeader>
          <CardBody className="p-3">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <QuickAction
                  key={action.label}
                  {...action}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Top productos y estado producción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Productos más vendidos</h2>
          </CardHeader>
          <CardBody>
            <BarChartComponent
              data={topProductsData}
              xKey="name"
              yKey="value"
              color="#c87d4a"
              height={260}
            />
          </CardBody>
        </Card>

        {/* Estado producción */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Producción actual</h2>
          </CardHeader>
          <CardBody>
            <PieChartComponent
              data={productionStatusData}
              height={260}
              innerRadius={50}
              outerRadius={85}
            />
            <div className="mt-4 space-y-3">
              {MOCK_DASHBOARD_STATS.productionStatus.map((status: typeof MOCK_DASHBOARD_STATS.productionStatus[0]) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: status.status === 'completada' ? '#22c55e' :
                                        status.status === 'en_horno' ? '#f59e0b' : '#3b82f6'
                      }}
                    />
                    <span className="text-sm text-bakery-700 capitalize">
                      {status.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-bakery-900">{status.count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Alertas y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas de stock */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bakery-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Alertas de stock
              </h2>
              <Badge variant="warning" size="sm">{lowStockIngredients.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {lowStockIngredients.slice(0, 5).map((ingredient: typeof MOCK_INGREDIENTS[0]) => (
                <div key={ingredient.id} className="p-3 hover:bg-bakery-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-bakery-900">{ingredient.name}</p>
                        <p className="text-xs text-bakery-500">
                          {ingredient.currentStock} {ingredient.unit} de {ingredient.minStock} mín.
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={ingredient.currentStock <= 0 ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {ingredient.currentStock <= 0 ? 'Agotado' : 'Bajo'}
                    </Badge>
                  </div>
                </div>
              ))}
              {lowStockIngredients.length > 5 && (
                <div className="p-3 text-center border-t border-bakery-100">
                  <Button variant="ghost" size="sm" className="w-full">
                    Ver todas ({lowStockIngredients.length})
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Próxima producción */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-600" />
              Próxima producción
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {pendingProduction.slice(0, 3).map((order: typeof MOCK_PRODUCTION_ORDERS[0]) => (
                <div key={order.id} className="p-3 hover:bg-bakery-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <ChefHat className="w-4 h-4 text-amber-600" />
                        </span>
                        <p className="text-sm font-medium text-bakery-900 truncate">{order.recipeName}</p>
                      </div>
                      <p className="text-xs text-bakery-500 ml-10">{order.quantity} unidades</p>
                    </div>
                    <Badge
                      variant={order.status === 'en_horno' ? 'warning' : order.status === 'planificada' ? 'info' : 'success'}
                      size="sm"
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 ml-10 flex items-center gap-3 text-xs text-bakery-500">
                    <span>🕐 {new Date(order.scheduledFor).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    {order.assignedTo && <span>👤 Panadero</span>}
                  </div>
                </div>
              ))}
              {pendingProduction.length === 0 && (
                <div className="p-6 text-center text-bakery-500">
                  <ChefHat className="w-12 h-12 mx-auto text-bakery-200 mb-2" />
                  <p className="text-sm">No hay producción programada</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Actividad reciente */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Actividad reciente</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {recentActivity.map((activity, index: number) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}