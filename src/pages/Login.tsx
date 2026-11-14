// F:\Programas\panaderia-control\src\pages\Login.tsx
// Página de inicio de sesión

'use client';

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { signIn, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bakery-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477 4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-bakery-900">Panadería Control</h1>
          <p className="text-bakery-500 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-bakery-900">Bienvenido</h2>
          </CardHeader>
          <CardBody className="space-y-5">
            {registered && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>¡Cuenta creada correctamente! Revisa tu email para confirmar la cuenta.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  disabled={loading || authLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">Contraseña</label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading || authLoading}
                leftIcon={<Loader2 className="w-4 h-4 animate-spin" />}
              >
                Iniciar sesión
              </Button>
            </form>

            <div className="pt-4 border-t border-bakery-100">
              <p className="text-xs text-bakery-500 text-center">
                ¿No tienes cuenta?{' '}
                <Link to="/signup" className="text-bakery-600 hover:text-bakery-900 font-medium">
                  Crea tu panadería
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