// F:\Programas\panaderia-control\src\components\ui\Modal.tsx
// Modal accesible con Radix UI patterns (implementación propia sin dependencias)

'use client';

import { useEffect, useRef, type ReactNode, Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Manejo de foco y trap
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    // Enfocar el modal
    setTimeout(() => contentRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <Fragment>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4 animate-slide-up',
          'focus:outline-none'
        )}
      >
        <div
          className={cn(
            'w-full bg-white rounded-2xl shadow-elevated overflow-hidden',
            sizeClasses[size]
          )}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-5 border-b border-bakery-100">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-bakery-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-bakery-500">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'p-1 rounded-lg text-bakery-400 hover:text-bakery-600 hover:bg-bakery-100',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-bakery-500',
                    'flex-shrink-0 ml-4'
                  )}
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );

  // Portal al body para evitar problemas de z-index
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// Modal de confirmación preconstruido
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) {
  const variantClasses = {
    danger: 'btn-danger',
    primary: 'btn-primary',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-bakery-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn btn-secondary"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          disabled={loading}
          className={cn('btn', variantClasses[variant])}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Procesando...
            </>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  );
}