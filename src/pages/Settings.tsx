'use client';

import { useState } from 'react';
import { Settings, Database, Palette, Bell, Shield, Save, Sun, Moon, Monitor } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { MOCK_BUSINESS_CONFIG } from '../constants/mockData';
import { cn } from '../utils/helpers';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'business', label: 'Negocio', icon: Database },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'security', label: 'Seguridad', icon: Shield },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [businessConfig, setBusinessConfig] = useState(MOCK_BUSINESS_CONFIG);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState<'es' | 'en' | 'ca' | 'eu' | 'gl'>('es');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Configuración</h1>
          <p className="text-bakery-500 mt-1">Personaliza tu panadería</p>
        </div>
        <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
          Guardar cambios
        </Button>
      </div>

      {/* Tabs navegación */}
      <Card>
        <CardBody className="p-0">
          <nav className="border-b border-bakery-100" aria-label="Configuración">
            <ul className="flex flex-wrap -mb-px" role="tablist">
              {TABS.map((tab) => (
                <li key={tab.id} role="presentation">
                  <button
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-bakery-600 text-bakery-900'
                        : 'border-transparent text-bakery-500 hover:text-bakery-700 hover:bg-bakery-50'
                    )}
                  >
                    <tab.icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </CardBody>
      </Card>

      {/* Paneles de contenido */}
      <div className="space-y-6" role="tabpanel" aria-labelledby={`${activeTab}-tab`}>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'business' && <BusinessSettings config={businessConfig} onChange={setBusinessConfig} />}
        {activeTab === 'appearance' && <AppearanceSettings theme={theme} onThemeChange={setTheme} language={language} onLanguageChange={setLanguage} />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-bakery-900">Configuración general</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Información de la cuenta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo" defaultValue="Panadero Demo" />
            <Input label="Email" type="email" defaultValue="admin@panaderiacontrol.com" />
            <Input label="Teléfono" defaultValue="+34 600 000 000" />
            <Input label="Zona horaria" defaultValue="Europe/Madrid" />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Preferencias</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-bakery-900">Modo compacto</p>
                <p className="text-sm text-bakery-500">Reduce el espaciado en tablas y listas</p>
              </div>
              <Toggle defaultChecked={false} />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-bakery-900">Animaciones</p>
                <p className="text-sm text-bakery-500">Activar transiciones y efectos visuales</p>
              </div>
              <Toggle defaultChecked={true} />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-bakery-900">Sonidos de notificación</p>
                <p className="text-sm text-bakery-500">Reproducir sonido al recibir alertas</p>
              </div>
              <Toggle defaultChecked={true} />
            </label>
          </div>
        </section>
      </CardBody>
    </Card>
  );
}

function BusinessSettings({ config, onChange }: { config: typeof MOCK_BUSINESS_CONFIG; onChange: (c: typeof MOCK_BUSINESS_CONFIG) => void }) {
  const updateField = <K extends keyof typeof config>(field: K, value: typeof config[K]) => {
    onChange({ ...config, [field]: value });
  };

  const updateOpeningHours = (day: keyof typeof config.openingHours, schedule: typeof config.openingHours[keyof typeof config.openingHours]) => {
    onChange({ ...config, openingHours: { ...config.openingHours, [day]: schedule } });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-bakery-900">Datos del negocio</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Información fiscal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre comercial" value={config.name} onChange={e => updateField('name', e.target.value)} />
            <Input label="CIF/NIF" value={config.taxId} onChange={e => updateField('taxId', e.target.value)} />
            <Input label="Dirección" value={config.address} onChange={e => updateField('address', e.target.value)} />
            <Input label="Teléfono" value={config.phone} onChange={e => updateField('phone', e.target.value)} />
            <Input label="Email" type="email" value={config.email} onChange={e => updateField('email', e.target.value)} />
            <Input label="Moneda" value={config.currency} onChange={e => updateField('currency', e.target.value)} />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Configuración fiscal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tipo de IVA (%)"
              type="number"
              value={config.taxRate}
              onChange={e => updateField('taxRate', Number(e.target.value))}
            />
            <Input
              label="Prefijo tickets"
              value={config.ticketPrefix}
              onChange={e => updateField('ticketPrefix', e.target.value)}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Horario de apertura</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(config.openingHours).map(([day, schedule]) => (
              <div key={day} className="p-3 bg-bakery-50 rounded-lg">
                <label className="block text-sm font-medium text-bakery-700 mb-2 capitalize">{day}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`open-${day}`}
                    checked={schedule.isOpen}
                    onChange={e => updateOpeningHours(day as keyof typeof config.openingHours, { ...schedule, isOpen: e.target.checked })}
                    className="w-4 h-4 text-bakery-600 rounded border-bakery-300 focus:ring-bakery-500"
                  />
                  <label htmlFor={`open-${day}`} className="text-sm text-bakery-600">Abierto</label>
                </div>
                {schedule.isOpen && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Apertura"
                      value={schedule.openTime}
                      className="w-24"
                      onChange={e => updateOpeningHours(day as keyof typeof config.openingHours, { ...schedule, openTime: e.target.value })}
                    />
                    <span className="text-bakery-400">-</span>
                    <Input
                      placeholder="Cierre"
                      value={schedule.closeTime}
                      className="w-24"
                      onChange={e => updateOpeningHours(day as keyof typeof config.openingHours, { ...schedule, closeTime: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardBody>
    </Card>
  );
}

function AppearanceSettings({ theme, onThemeChange, language, onLanguageChange }: { theme: 'light' | 'dark' | 'system'; onThemeChange: (t: 'light' | 'dark' | 'system') => void; language: 'es' | 'en' | 'ca' | 'eu' | 'gl'; onLanguageChange: (l: 'es' | 'en' | 'ca' | 'eu' | 'gl') => void }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-bakery-900">Apariencia</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Tema</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <label key={t} className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all',
                theme === t ? 'border-bakery-600 bg-bakery-50' : 'border-bakery-100 hover:border-bakery-300'
              )}>
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => onThemeChange(t)}
                  className="sr-only"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-16 h-10 rounded-lg border flex items-center justify-center',
                    t === 'light' ? 'bg-white border-bakery-200' :
                    t === 'dark' ? 'bg-bakery-900 border-bakery-700' : 'bg-gradient-to-r from-white to-bakery-900 border-bakery-300'
                  )}>
                    {t === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
                    {t === 'dark' && <Moon className="w-5 h-5 text-blue-400" />}
                    {t === 'system' && <Monitor className="w-5 h-5 text-bakery-600" />}
                  </div>
                  <span className="text-sm font-medium text-bakery-900 capitalize">{t}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Idioma</h3>
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={e => onLanguageChange(e.target.value as 'es' | 'en' | 'ca' | 'eu' | 'gl')}
              className="input w-auto"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="ca">Català</option>
              <option value="eu">Euskara</option>
              <option value="gl">Galego</option>
            </select>
          </div>
        </section>
      </CardBody>
    </Card>
  );
}

function NotificationSettings() {
  const notifications = [
    { key: 'lowStock', label: 'Stock bajo', description: 'Alerta cuando un ingrediente está por debajo del mínimo' },
    { key: 'productionComplete', label: 'Producción completada', description: 'Notificar cuando finalice una orden de producción' },
    { key: 'newOrder', label: 'Nuevo pedido', description: 'Aviso de pedidos de clientes entrantes' },
    { key: 'dailyReport', label: 'Reporte diario', description: 'Resumen de ventas y producción al cierre' },
    { key: 'weeklyReport', label: 'Reporte semanal', description: 'Análisis semanal enviado los lunes' },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-bakery-900">Notificaciones</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {notifications.map((notif) => (
          <label key={notif.key} className="flex items-center justify-between p-3 bg-bakery-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-bakery-900">{notif.label}</p>
              <p className="text-sm text-bakery-500">{notif.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Toggle defaultChecked={true} />
              <Badge variant="info" size="sm">Push + Email</Badge>
            </div>
          </label>
        ))}
      </CardBody>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-bakery-900">Seguridad</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Cambiar contraseña</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contraseña actual" type="password" />
            <Input label="Nueva contraseña" type="password" />
            <Input label="Confirmar contraseña" type="password" />
          </div>
          <Button variant="primary">Actualizar contraseña</Button>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Autenticación de dos factores (2FA)</h3>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-3">La 2FA añade una capa extra de seguridad a tu cuenta.</p>
            <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>
              Activar 2FA
            </Button>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-bakery-700 mb-4">Sesiones activas</h3>
          <div className="divide-y divide-bakery-100">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="w-10 h-10 rounded-lg bg-bakery-100 flex items-center justify-center text-bakery-600" />
                <div>
                  <p className="font-medium text-bakery-900">Esta sesión</p>
                  <p className="text-sm text-bakery-500">Chrome en Windows • Hace 2 min</p>
                </div>
              </div>
              <Badge variant="success" size="sm">Actual</Badge>
            </div>
          </div>
          <Button variant="ghost" className="mt-4 text-red-600 hover:bg-red-50">
            Cerrar todas las demás sesiones
          </Button>
        </section>
      </CardBody>
    </Card>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => setChecked(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-bakery-600' : 'bg-bakery-200'
      )}
      aria-label={checked ? 'Desactivar' : 'Activar'}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
        aria-hidden="true"
      />
    </button>
  );
}