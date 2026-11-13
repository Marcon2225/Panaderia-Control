'use client';

import { Link, useLocation, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ChefHat,
  Users,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Inventario', href: '/inventory', icon: <Package className="w-5 h-5" />, badge: 3, badgeVariant: 'warning' },
  { label: 'Ventas', href: '/sales', icon: <ShoppingCart className="w-5 h-5" /> },
  { label: 'Producción', href: '/production', icon: <ChefHat className="w-5 h-5" />, badge: 2, badgeVariant: 'info' },
  { label: 'Clientes', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Reportes', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Configuración', href: '/settings', icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-bakery-100 transition-all duration-300 ease-in-out flex flex-col',
          isMobile
            ? 'w-64 transform -translate-x-full lg:translate-x-0'
            : isCollapsed
            ? 'w-20'
            : 'w-64',
          isMobile && isOpen ? 'translate-x-0' : '',
          isMobile && !isOpen ? '-translate-x-full' : ''
        )}
        aria-label="Navegación principal"
      >
        {/* Header del sidebar */}
        <div className={cn('flex items-center justify-between h-16 px-4 border-b border-bakery-100', isCollapsed && 'justify-center')}>
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2" aria-label="Panadería Control - Inicio">
              <div className="w-8 h-8 rounded-lg bg-bakery-600 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-bakery-900 text-lg">Panadería Control</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="p-2" aria-label="Panadería Control - Inicio">
              <div className="w-8 h-8 rounded-lg bg-bakery-600 flex items-center justify-center mx-auto">
                <ChefHat className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
            </Link>
          )}

          {!isMobile && onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className={cn('text-bakery-500 hover:text-bakery-700', isCollapsed && 'rotate-180')}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          )}

          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Menú principal">
          <ul className="space-y-1" role="list">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive: active }) => cn(
                      'sidebar-link',
                      isCollapsed && 'justify-center px-2',
                      active && 'sidebar-link-active'
                    )}
                    title={isCollapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={cn('flex-shrink-0', isCollapsed && 'mx-auto')} aria-hidden="true">
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || 'default'}
                            size="sm"
                            className="flex-shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip para items colapsados */}
                  {isCollapsed && (
                    <div className="absolute left-20 top-0 ml-2 px-3 py-2 bg-bakery-900 text-white text-sm rounded-lg shadow-elevated whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 px-1.5 py-0.5 bg-bakery-600 rounded-full text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div className={cn('p-4 border-t border-bakery-100', isCollapsed && 'hidden')}>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bakery-50">
            <div className="w-8 h-8 rounded-full bg-bakery-200 flex items-center justify-center flex-shrink-0">
              <span className="text-bakery-700 font-medium text-sm">PC</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-bakery-900 truncate">Panadero Demo</p>
              <p className="text-xs text-bakery-500 truncate">admin@panaderiacontrol.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}