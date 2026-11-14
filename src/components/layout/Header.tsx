'use client';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Menu,
  Search,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { cn, formatTime } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile?: boolean;
}

const NOTIFICATIONS = [
  { id: '1', title: 'Stock bajo: Levadura fresca', message: 'Quedan 3 kg (mínimo 5 kg)', time: 'Hace 10 min', type: 'warning', read: false },
  { id: '2', title: 'Producción completada', message: 'Pan Baguette - 30 unidades listas', time: 'Hace 25 min', type: 'success', read: false },
  { id: '3', title: 'Nuevo pedido cliente', message: 'María González - Tarta de Santiago', time: 'Hace 1 hora', type: 'info', read: true },
];

export function Header({ onMenuClick, isMobile = false }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const currentTime = new Date();

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.name ?? 'Usuario';
  const userEmail = user?.email ?? 'email@ejemplo.com';
  const userRole = user?.role ?? 'vendedor';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-bakery-100 transition-all duration-300',
        isMobile ? 'left-0' : 'lg:left-64'
      )}
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Lado izquierdo - Menú y búsqueda */}
        <div className="flex items-center gap-4">
          {/* Botón menú móvil */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menú"
            aria-expanded="false"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Búsqueda global */}
          <div className="hidden md:block relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar productos, clientes, pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
              aria-label="Búsqueda global"
            />
          </div>
        </div>

        {/* Centro - Hora actual (solo desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-bakery-900" aria-live="polite">
              {formatTime(currentTime)}
            </p>
            <p className="text-xs text-bakery-500">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Lado derecho - Acciones */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <div className="relative" data-dropdown>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
              aria-expanded={notificationsOpen}
              aria-haspopup="true"
            >
              <Bell className="w-5 h-5 text-bakery-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-bakery-100 shadow-elevated animate-slide-down z-50">
                <div className="p-4 border-b border-bakery-100 flex items-center justify-between">
                  <h3 className="font-semibold text-bakery-900">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setUnreadCount(0)}>
                      Marcar todas leídas
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {NOTIFICATIONS.map((notification) => (
                    <button
                      key={notification.id}
                      className={cn(
                        'w-full p-4 hover:bg-bakery-50 transition-colors text-left border-b border-bakery-100 last:border-0',
                        !notification.read && 'bg-bakery-50/50'
                      )}
                      onClick={() => {
                        if (!notification.read) setUnreadCount(c => Math.max(0, c - 1));
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          notification.type === 'success' && 'bg-green-100 text-green-600',
                          notification.type === 'warning' && 'bg-amber-100 text-amber-600',
                          notification.type === 'danger' && 'bg-red-100 text-red-600',
                          notification.type === 'info' && 'bg-blue-100 text-blue-600'
                        )}>
                          {notification.type === 'success' && <AlertTriangle className="w-4 h-4" />}
                          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                          {notification.type === 'danger' && <AlertTriangle className="w-4 h-4" />}
                          {notification.type === 'info' && <Bell className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium text-bakery-900', !notification.read && 'font-semibold')}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-bakery-500 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-bakery-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-bakery-600 flex-shrink-0 mt-1" aria-label="No leída" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-bakery-100">
                  <Link
                    to="/notifications"
                    className="block text-center text-sm text-bakery-600 hover:text-bakery-900 font-medium"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Tema */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          {/* Menú usuario */}
          <div className="relative" data-dropdown>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 px-3 py-1.5"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-bakery-100 flex items-center justify-center">
                <User className="w-5 h-5 text-bakery-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-bakery-700">Panadero Demo</span>
              <ChevronDown className="w-4 h-4 text-bakery-500 hidden sm:block" />
            </Button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-bakery-100 shadow-elevated animate-slide-down z-50">
                <div className="p-3 border-b border-bakery-100">
                  <p className="text-sm font-medium text-bakery-900">{userName}</p>
                  <p className="text-xs text-bakery-500">{userEmail}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-bakery-100 text-bakery-700 rounded-full capitalize">
                    {userRole}
                  </span>
                </div>
                <nav className="py-2">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-bakery-700 hover:bg-bakery-50 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Configuración</span>
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}