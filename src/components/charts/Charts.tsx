'use client';

import { cn } from '../../utils/helpers';
import { CHART_COLORS } from '../../utils/helpers';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface ChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  showArea?: boolean;
  className?: string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function LineChartComponent({
  data,
  xKey,
  yKeys,
  colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.tertiary],
  height = 250,
  showArea = false,
  className,
  tooltipFormatter,
}: ChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] bg-bakery-50 rounded-xl', className)}>
        <p className="text-bakery-500 text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-bakery-200 rounded-lg shadow-elevated p-3 min-w-[160px]">
          <p className="text-xs text-bakery-500 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-bakery-700">
                {entry.name}:{' '}
                <span className="font-medium text-bakery-900">
                  {tooltipFormatter
                    ? tooltipFormatter(entry.value as number, entry.name)[0]
                    : (entry.value as number).toLocaleString('es-ES')}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {yKeys.map((key, index) => (
                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8c0a0" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#8e4e2d', fontSize: 11 }}
              axisLine={{ stroke: '#e8c0a0' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#8e4e2d', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => (value >= 1000 ? `${(value/1000).toFixed(1)}k` : String(value))}
            />
            <Tooltip content={<CustomTooltip />} />
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={`url(#color${key})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8c0a0" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: '#8e4e2d', fontSize: 11 }}
              axisLine={{ stroke: '#e8c0a0' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#8e4e2d', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => (value >= 1000 ? `${(value/1000).toFixed(1)}k` : String(value))}
            />
            <Tooltip content={<CustomTooltip />} />
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartData[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
}

export function BarChartComponent({
  data,
  xKey,
  yKey,
  color = CHART_COLORS.primary,
  height = 250,
  className,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] bg-bakery-50 rounded-xl', className)}>
        <p className="text-bakery-500 text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-bakery-200 rounded-lg shadow-elevated p-3">
          <p className="text-xs text-bakery-500 mb-1">{label}</p>
          <p className="text-sm font-medium text-bakery-900">
            {(payload[0].value as number).toLocaleString('es-ES')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8c0a0" horizontal={false} vertical={false} />
          <XAxis
            dataKey={xKey}
            type="category"
            tick={{ fill: '#8e4e2d', fontSize: 11 }}
            axisLine={{ stroke: '#e8c0a0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8e4e2d', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => (value >= 1000 ? `${(value/1000).toFixed(1)}k` : String(value))}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={yKey}>
            {data.map((_item: BarChartData, index: number) => {
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
}

export function PieChartComponent({
  data,
  height = 250,
  className,
  innerRadius = 60,
  outerRadius = 100,
}: PieChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-[250px] bg-bakery-50 rounded-xl', className)}>
        <p className="text-bakery-500 text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const COLORS = data.map((d, i) => d.color || [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.info,
  ][i % 6]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-white border border-bakery-200 rounded-lg shadow-elevated p-3">
          <p className="text-sm font-medium text-bakery-900">{payload[0].name}</p>
          <p className="text-sm text-bakery-700">
            {payload[0].value.toLocaleString('es-ES')} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderPieLabel = ({ name, percent }: { name?: string; percent?: number }) => {
    if (!name || percent === undefined) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={renderPieLabel}
            labelLine={false}
          >
            {data.map((_item: PieChartData, index: number) => {
              return <Cell key={`cell-${index}`} fill={COLORS[index]} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value: string) => (
              <span className="text-sm text-bakery-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}