'use client';

import { ChefHat, Plus, Clock, CheckCircle, Package, Play, Check } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MOCK_PRODUCTION_ORDERS, MOCK_RECIPES } from '../constants/mockData';
import { formatDateTime } from '../utils/helpers';

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

export function Production() {
  const activeOrders = MOCK_PRODUCTION_ORDERS.filter(o => o.status !== 'completada' && o.status !== 'cancelada');
  const completedToday = MOCK_PRODUCTION_ORDERS.filter(o => o.status === 'completada').length;
  const totalPlanned = MOCK_PRODUCTION_ORDERS.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Producción</h1>
          <p className="text-bakery-500 mt-1">Órdenes de producción y recetas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
            Nueva orden
          </Button>
          <Button variant="primary" leftIcon={<ChefHat className="w-4 h-4" />}>
            Iniciar producción
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSummary label="Órdenes activas" value={activeOrders.length} icon={<Clock className="w-6 h-6" />} iconColor="#f59e0b" />
        <StatCardSummary label="Completadas hoy" value={completedToday} icon={<CheckCircle className="w-6 h-6" />} iconColor="#22c55e" />
        <StatCardSummary label="Unidades planificadas" value={totalPlanned} icon={<Package className="w-6 h-6" />} iconColor="#c87d4a" />
        <StatCardSummary label="Recetas disponibles" value={MOCK_RECIPES.length} icon={<ChefHat className="w-6 h-6" />} iconColor="#3b82f6" />
      </div>

      {/* Órdenes de producción */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Órdenes activas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bakery-900">Órdenes activas</h2>
              <Badge variant="info" size="sm">{activeOrders.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {activeOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-bakery-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-amber-600" />
                        </span>
                        <div>
                          <p className="font-medium text-bakery-900">{order.recipeName}</p>
                          <p className="text-sm text-bakery-500">{order.quantity} unidades</p>
                        </div>
                      </div>
                      <div className="ml-13 flex flex-wrap items-center gap-4 text-sm text-bakery-500">
                        <span>🕐 {formatDateTime(order.scheduledFor)}</span>
                        {order.startedAt && <span>▶ Iniciada: {formatDateTime(order.startedAt)}</span>}
                        {order.assignedTo && <span>👤 Panadero asignado</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={order.status === 'en_horno' ? 'warning' : order.status === 'en_progreso' ? 'info' : 'default'}
                        size="md"
                      >
                        {order.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex gap-1">
                        {order.status === 'planificada' && (
                          <Button variant="primary" size="sm" leftIcon={<Play className="w-3 h-3" />}>
                            Iniciar
                          </Button>
                        )}
                        {order.status === 'en_progreso' && (
                          <Button variant="secondary" size="sm" leftIcon={<ChefHat className="w-3 h-3" />}>
                            Al horno
                          </Button>
                        )}
                        {order.status === 'en_horno' && (
                          <Button variant="primary" size="sm" leftIcon={<Check className="w-3 h-3" />}>
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {activeOrders.length === 0 && (
                <div className="p-8 text-center text-bakery-500">
                  <ChefHat className="w-16 h-16 mx-auto text-bakery-200 mb-3" />
                  <p className="text-lg font-medium text-bakery-700 mb-1">No hay órdenes activas</p>
                  <p className="text-sm">Crea una nueva orden de producción</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recetas */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Recetas disponibles</h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-bakery-100">
              {MOCK_RECIPES.map((recipe) => (
                <div key={recipe.id} className="p-4 hover:bg-bakery-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-bakery-100 flex items-center justify-center">
                          <ChefHat className="w-5 h-5 text-bakery-600" />
                        </span>
                        <div>
                          <p className="font-medium text-bakery-900">{recipe.name}</p>
                          <p className="text-sm text-bakery-500">Rinde: {recipe.yield} {recipe.yieldUnit} • {recipe.prepTime + (recipe.bakeTime || 0) + (recipe.restTime || 0)} min total</p>
                        </div>
                      </div>
                      <div className="ml-13 mt-2 flex flex-wrap items-center gap-3 text-xs text-bakery-500">
                        <Badge variant="neutral" size="sm">{recipe.difficulty}</Badge>
                        <span>Coste/u: €{recipe.costPerUnit.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" leftIcon={<Plus className="w-3 h-3" />} className="whitespace-nowrap">
                      Producir
                    </Button>
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