// F:\Programas\panaderia-control\src\pages\Signup.tsx
// Página de registro

'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Building2, User } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

export function SignupPage() {
  const { signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    tradeName: '',
    email: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      business_name: formData.businessName,
      trade_name: formData.tradeName || formData.businessName,
      name: formData.ownerName,
      currency: formData.currency,
      timezone: formData.timezone,
    });

    if (error) {
      setError(error.message);
    } else {
      // Redirigir a login con mensaje de confirmación
      navigate('/login?registered=true');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-12">
      <div className="w-full max-w-xl animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bakery-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Crear cuenta</h1>
          <p className="text-bakery-500 mt-1">Configura tu panadería en minutos</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-bakery-900">Datos del negocio</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nombre del negocio */}
              <div>
                <label htmlFor="businessName" className="label">Nombre del negocio <span className="text-red-500">*</span></label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Panadería El Horno"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  required
                  disabled={loading || authLoading}
                  autoComplete="organization"
                />
              </div>

              {/* Nombre comercial (opcional) */}
              <div>
                <label htmlFor="tradeName" className="label">Nombre comercial</label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="El Horno (opcional)"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  disabled={loading || authLoading}
                />
              </div>

              {/* Nombre del propietario */}
              <div>
                <label htmlFor="ownerName" className="label">Tu nombre <span className="text-red-500">*</span></label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  disabled={loading || authLoading}
                  autoComplete="name"
                />
              </div>

              <hr className="border-bakery-100 my-2" />

              <h3 className="text-sm font-medium text-bakery-700">Configuración regional</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Moneda */}
                <div>
                  <label htmlFor="currency" className="label">Moneda</label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input"
                    disabled={loading || authLoading}
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="CLP">CLP - Peso Chileno</option>
                    <option value="PEN">PEN - Sol Peruano</option>
                    <option value="UYU">UYU - Peso Uruguayo</option>
                  </select>
                </div>

                {/* Zona horaria */}
                <div>
                  <label htmlFor="timezone" className="label">Zona horaria</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="input"
                    disabled={loading || authLoading}
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Lima">Lima (GMT-5)</option>
                    <option value="America/Santiago">Santiago (GMT-4/-3)</option>
                    <option value="America/Montevideo">Montevideo (GMT-3)</option>
                    <option value="America/Caracas">Caracas (GMT-4)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1/+2)</option>
                  </select>
                </div>
              </div>

              <hr className="border-bakery-100 my-2" />

              {/* Email */}
              <div>
                <label htmlFor="email" className="label">Email <span className="text-red-500">*</span></label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  disabled={loading || authLoading}
                  autoComplete="email"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="label">Contraseña <span className="text-red-500">*</span></label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-bakery-400 hover:text-bakery-600"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                  disabled={loading || authLoading}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="label">Confirmar contraseña <span className="text-red-500">*</span></label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                  disabled={loading || authLoading}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading || authLoading}
                leftIcon={<Loader2 className="w-4 h-4 animate-spin" />}
              >
                Crear mi panadería
              </Button>
            </form>

            <div className="pt-4 border-t border-bakery-100">
              <p className="text-xs text-bakery-500 text-center">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-bakery-600 hover:text-bakery-900 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-bakery-400 mt-6">
          Panadería Control v1.0.0
        </p>
      </div>
    </div>
  );
}