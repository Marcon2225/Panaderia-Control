'use client';

import { Download, Calendar, Filter } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LineChartComponent, BarChartComponent, PieChartComponent } from '../components/charts/Charts';
import { MOCK_PRODUCTS } from '../constants/mockData';
import { formatCurrency } from '../utils/helpers';

function SummaryItem({ label, value, trend, positive }: { label: string; value: string; trend: number; positive: boolean }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-bakery-100">
      <p className="text-sm text-bakery-500">{label}</p>
      <p className="text-2xl font-bold text-bakery-900 mt-1">{value}</p>
      <p className={`text-sm font-medium mt-2 ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {positive ? '+' : ''}{trend.toFixed(1)}% vs período anterior
      </p>
    </div>
  );
}

export function Reports() {
  // Datos mock para reportes
  const weeklySales = [
    { label: 'Lun', value: 450 },
    { label: 'Mar', value: 520 },
    { label: 'Mié', value: 480 },
    { label: 'Jue', value: 610 },
    { label: 'Vie', value: 780 },
    { label: 'Sáb', value: 920 },
    { label: 'Dom', value: 340 },
  ];

  const salesByCategory = [
    { name: 'Pan', value: 1250 },
    { name: 'Bollería', value: 980 },
    { name: 'Pastelería', value: 560 },
    { name: 'Salado', value: 340 },
    { name: 'Bebidas', value: 210 },
  ];

  const topProductsRevenue = MOCK_PRODUCTS
    .map(p => ({ name: p.name, value: p.price * 10 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stockValueByCategory = [
    { name: 'Harinas', value: 85 },
    { name: 'Lácteos', value: 120 },
    { name: 'Otros', value: 65 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Reportes</h1>
          <p className="text-bakery-500 mt-1">Análisis de ventas, producción e inventario</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-400" />
            <Input placeholder="Rango de fechas" leftIcon={<Calendar className="w-4 h-4" />} className="w-48 pl-10" />
          </div>
          <Button variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
            Filtros
          </Button>
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Ventas semanales */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bakery-900">Ventas semanales</h2>
        </CardHeader>
        <CardBody>
          <LineChartComponent
            data={weeklySales}
            xKey="label"
            yKeys={['value']}
            colors={['#c87d4a']}
            height={300}
            showArea={true}
            tooltipFormatter={(value) => [formatCurrency(value), 'Ventas']}
          />
        </CardBody>
      </Card>

      {/* Gráficos de categorías y top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Ventas por categoría</h2>
          </CardHeader>
          <CardBody>
            <PieChartComponent
              data={salesByCategory}
              height={280}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Top productos por ingresos</h2>
          </CardHeader>
          <CardBody>
            <BarChartComponent
              data={topProductsRevenue}
              xKey="name"
              yKey="value"
              color="#c87d4a"
              height={280}
            />
          </CardBody>
        </Card>
      </div>

      {/* Valor inventario y resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Valor inventario por tipo</h2>
          </CardHeader>
          <CardBody>
            <PieChartComponent
              data={stockValueByCategory}
              height={250}
              innerRadius={40}
              outerRadius={75}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-bakery-900">Resumen financiero del período</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryItem label="Ingresos totales" value={formatCurrency(3840)} trend={12.5} positive />
              <SummaryItem label="Coste mercancía" value={formatCurrency(1420)} trend={-3.2} positive />
              <SummaryItem label="Margen bruto" value={formatCurrency(2420)} trend={18.7} positive />
              <SummaryItem label="Margen %" value="63.0%" trend={4.1} positive />
            </div>
            <div className="mt-6 p-4 bg-bakery-50 rounded-xl">
              <h3 className="font-medium text-bakery-900 mb-3">Detalle por categoría</h3>
              <div className="space-y-2">
                {[
                  { category: 'Pan', revenue: 1250, cost: 380, margin: 69.6 },
                  { category: 'Bollería', revenue: 980, cost: 420, margin: 57.1 },
                  { category: 'Pastelería', revenue: 560, cost: 220, margin: 60.7 },
                  { category: 'Salado', revenue: 340, cost: 150, margin: 55.9 },
                  { category: 'Bebidas', revenue: 210, cost: 50, margin: 76.2 },
                ].map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between py-2 border-b border-bakery-100 last:border-0">
                    <span className="text-bakery-700">{cat.category}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-bakery-900 font-mono">{formatCurrency(cat.revenue)}</span>
                      <span className="text-bakery-500">{formatCurrency(cat.cost)}</span>
                      <span className="font-medium text-green-600">{cat.margin.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}