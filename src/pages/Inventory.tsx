'use client';

import { Package, Plus, Download, Search, Edit, History, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { MOCK_INGREDIENTS } from '../constants/mockData';
import { formatCurrency, getStockStatus, getStockStatusLabel, getStockStatusBadgeVariant } from '../utils/helpers';

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

export function Inventory() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Inventario</h1>
          <p className="text-bakery-500 mt-1">Gestión de ingredientes y stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
            Nuevo ingrediente
          </Button>
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Entrada de stock
          </Button>
        </div>
      </div>

      {/* Resumen de stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSummary label="Total ingredientes" value={MOCK_INGREDIENTS.length} icon={<Package className="w-6 h-6" />} iconColor="#c87d4a" />
        <StatCardSummary label="Stock crítico" value={MOCK_INGREDIENTS.filter(i => i.currentStock <= 0).length} icon={<AlertTriangle className="w-6 h-6" />} iconColor="#ef4444" />
        <StatCardSummary label="Stock bajo" value={MOCK_INGREDIENTS.filter(i => i.currentStock > 0 && i.currentStock < i.minStock).length} icon={<AlertTriangle className="w-6 h-6" />} iconColor="#f59e0b" />
        <StatCardSummary label="Valor inventario" value={formatCurrency(MOCK_INGREDIENTS.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0))} icon={<DollarSign className="w-6 h-6" />} iconColor="#22c55e" />
      </div>

      {/* Tabla de ingredientes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-bakery-900">Ingredientes</h2>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar ingrediente..." leftIcon={<Search className="w-4 h-4" />} className="w-64" />
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th className="hidden md:table-cell">Proveedor</th>
                  <th className="text-right">Stock actual</th>
                  <th className="text-right hidden lg:table-cell">Mín / Máx</th>
                  <th className="text-right">Valor</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INGREDIENTS.map((ingredient) => {
                  const status = getStockStatus(ingredient.currentStock, ingredient.minStock, ingredient.maxStock);
                  return (
                    <tr key={ingredient.id}>
                      <td>
                        <div>
                          <p className="font-medium text-bakery-900">{ingredient.name}</p>
                          <p className="text-xs text-bakery-500">{ingredient.unit}</p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-bakery-600">{ingredient.supplier || '—'}</td>
                      <td className="text-right font-mono font-medium text-bakery-900">
                        {ingredient.currentStock.toLocaleString('es-ES')} {ingredient.unit}
                      </td>
                      <td className="text-right hidden lg:table-cell text-bakery-500 text-sm">
                        {ingredient.minStock} / {ingredient.maxStock} {ingredient.unit}
                      </td>
                      <td className="text-right font-mono text-bakery-700">
                        {formatCurrency(ingredient.currentStock * ingredient.costPerUnit)}
                      </td>
                      <td>
                        <Badge variant={getStockStatusBadgeVariant(status)} size="sm" dot>
                          {getStockStatusLabel(status)}
                        </Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="p-1.5" aria-label="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1.5" aria-label="Movimientos">
                            <History className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}