// F:\Programas\panaderia-control\src\components\ui\Toast.tsx
// Toast notifications usando Sonner

'use client';

import { useCallback } from 'react';
import { toast, Toaster, type ToastT, type ExternalToast } from 'sonner';

// Configuración global del Toaster
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-white border-bakery-100 shadow-elevated rounded-xl',
            description: 'text-bakery-600',
            actionButton: 'bg-bakery-100 hover:bg-bakery-200 text-bakery-700',
            cancelButton: 'text-bakery-500 hover:text-bakery-700',
            closeButton: 'text-bakery-400 hover:text-bakery-600',
          },
          style: {
            background: 'white',
            border: '1px solid var(--color-bakery-100)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-elevated)',
            padding: '16px',
          },
          duration: 4000,
        }}
        richColors
        expand={false}
        closeButton
      />
    </>
  );
}

// Tipos de toast personalizados
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions extends Omit<ExternalToast, 'action' | 'cancel'> {
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

// Hook para usar toasts en componentes
export function useToast() {
  const showToast = useCallback((
    message: string,
    options: ToastOptions = {}
  ) => {
    const { variant = 'default', action, cancel, ...rest } = options;

    switch (variant) {
      case 'success':
        return toast.success(message, { ...rest, action, cancel });
      case 'error':
        return toast.error(message, { ...rest, action, cancel });
      case 'warning':
        return toast.warning(message, { ...rest, action, cancel });
      case 'info':
        return toast.info(message, { ...rest, action, cancel });
      case 'loading':
        return toast.loading(message, { ...rest, action, cancel });
      default:
        return toast(message, { ...rest, action, cancel });
    }
  }, []);

  const dismiss = useCallback((toastId?: string | number) => {
    toast.dismiss(toastId);
  }, []);

  const promise = useCallback(<T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  }, []);

  return { toast: showToast, dismiss, promise };
}

// Funciones de conveniencia (para uso sin hook)
export const showSuccess = (message: string, options?: ToastOptions) =>
  toast.success(message, options);

export const showError = (message: string, options?: ToastOptions) =>
  toast.error(message, options);

export const showWarning = (message: string, options?: ToastOptions) =>
  toast.warning(message, options);

export const showInfo = (message: string, options?: ToastOptions) =>
  toast.info(message, options);

export const showLoading = (message: string, options?: ToastOptions) =>
  toast.loading(message, options);

export const dismissToast = (toastId?: string | number) =>
  toast.dismiss(toastId);

export const promiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => toast.promise(promise, messages);

// Toast personalizado con acción
export function actionToast(
  message: string,
  actionLabel: string,
  onAction: () => void,
  options: Omit<ToastOptions, 'action'> = {}
) {
  return toast(message, {
    ...options,
    action: {
      label: actionLabel,
      onClick: onAction,
    },
  });
}

// Toast con confirmación (dos botones)
export function confirmToast(
  message: string,
  onConfirm: () => void,
  onCancel: () => void,
  options: Omit<ToastOptions, 'action' | 'cancel'> = {}
) {
  return toast(message, {
    ...options,
    action: {
      label: 'Confirmar',
      onClick: onConfirm,
    },
    cancel: {
      label: 'Cancelar',
      onClick: onCancel,
    },
  });
}

// Toast de éxito con acción "Deshacer"
export function undoToast(
  message: string,
  onUndo: () => void,
  options: Omit<ToastOptions, 'action'> = {}
) {
  return toast.success(message, {
    ...options,
    action: {
      label: 'Deshacer',
      onClick: onUndo,
    },
    duration: 8000, // Más tiempo para permitir deshacer
  });
}

// Componente para usar en formularios con validación
export function useFormToast() {
  const { dismiss } = useToast();
  // Usar toast de sonner directamente para acceso a .error, .success, etc.
  const { toast: sonnerToast } = { toast };

  const showFieldError = useCallback((fieldName: string, message: string) => {
    sonnerToast.error(`${fieldName}: ${message}`, {
      id: `field-error-${fieldName}`,
    });
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    dismiss(`field-error-${fieldName}`);
  }, [dismiss]);

  const showSubmitError = useCallback((message: string) => {
    sonnerToast.error(message, {
      id: 'submit-error',
      action: {
        label: 'Reintentar',
        onClick: () => dismiss('submit-error'),
      },
    });
  }, [dismiss]);

  const showSubmitSuccess = useCallback((message: string) => {
    sonnerToast.success(message, { id: 'submit-success' });
  }, []);

  return {
    showFieldError,
    clearFieldError,
    showSubmitError,
    showSubmitSuccess,
    dismiss,
  };
}

// Re-exportar toast de sonner para casos avanzados
export { toast, Toaster };
export type { ToastT, ExternalToast };