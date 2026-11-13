// Utilidades comunes - Panadería Control

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma inteligente
 * Usa clsx para condicionales y twMerge para resolver conflictos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number, currency = 'EUR', locale = 'es-ES'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' },
  locale = 'es-ES'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Formatea una hora
 */
export function formatTime(date: string | Date, locale = 'es-ES'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Formatea fecha y hora completa
 */
export function formatDateTime(date: string | Date, locale = 'es-ES'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Obtiene el estado del stock
 */
export function getStockStatus(current: number, min: number, max: number): 'ok' | 'low' | 'critical' | 'overstock' {
  if (current <= 0) return 'critical';
  if (current < min) return 'low';
  if (current > max) return 'overstock';
  return 'ok';
}

/**
 * Etiqueta legible del estado de stock
 */
export function getStockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ok: 'Normal',
    low: 'Bajo',
    critical: 'Crítico',
    overstock: 'Exceso',
  };
  return labels[status] || status;
}

/**
 * Clase CSS para el badge de estado de stock
 */
export function getStockStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ok: 'badge-success',
    low: 'badge-warning',
    critical: 'badge-danger',
    overstock: 'badge-info',
  };
  return colors[status] || 'badge-neutral';
}

/**
 * Variante de Badge para el estado de stock
 */
export function getStockStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    ok: 'success',
    low: 'warning',
    critical: 'danger',
    overstock: 'info',
  };
  return variants[status] || 'neutral';
}

/**
 * Calcula porcentaje de cambio
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Formatea porcentaje con signo
 */
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Trunca texto con elipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Genera ID único simple
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce para optimizar búsquedas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Agrupa array por clave
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Ordena array por clave
 */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Capitaliza primera letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convierte a slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Colores para gráficos - Paleta panadería
 */
export const CHART_COLORS = {
  primary: '#c87d4a',
  secondary: '#b06338',
  tertiary: '#e8c0a0',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  neutral: '#8e4e2d',
  cream: '#fdfcf7',
  bakeryLight: '#faf0e6',
  bakeryDark: '#5f3524',
};

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
  CHART_COLORS.neutral,
];

/**
 * Obtiene color por índice
 */
export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida teléfono español
 */
export function isValidPhone(phone: string): boolean {
  const regex = /^(\+34|0034)?[6789]\d{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Días de la semana en español
 */
export const WEEKDAYS_ES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export const WEEKDAYS_SHORT_ES = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
];

/**
 * Obtiene día de la semana
 */
export function getWeekday(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return WEEKDAYS_ES[d.getDay()];
}

/**
 * Verifica si es día laborable
 */
export function isWeekday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day >= 1 && day <= 5;
}