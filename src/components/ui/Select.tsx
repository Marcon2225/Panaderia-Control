// F:\Programas\panaderia-control\src\components\ui\Select.tsx
// Select accesible con búsqueda opcional y múltiples

'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { createPortal } from 'react-dom';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectProps<T = string> {
  label?: string;
  placeholder?: string;
  value?: T | T[];
  onChange: (value: T | T[] | undefined) => void;
  options: SelectOption<T>[];
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  name?: string;
  'aria-label'?: string;
  className?: string;
}

export function Select<T = string>({
  label,
  placeholder = 'Seleccionar...',
  value,
  onChange,
  options,
  multiple = false,
  searchable = false,
  disabled = false,
  required = false,
  error,
  hint,
  name,
  'aria-label': ariaLabel,
  className,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const isArrayValue = Array.isArray(value);
  const currentValue = isArrayValue ? value : value ? [value] : [];

  // Filtrar opciones
  const filteredOptions = options.filter((opt) => {
    if (opt.disabled) return true;
    if (!searchQuery) return true;
    return opt.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Cerrar al click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll a opción destacada
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const option = optionsRef.current.children[highlightedIndex] as HTMLElement;
      option?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Focus management
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const enabledOptions = filteredOptions.filter((o) => !o.disabled);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, enabledOptions.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        if (highlightedIndex >= 0 && enabledOptions[highlightedIndex]) {
          e.preventDefault();
          handleSelect(enabledOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;
    }
  }, [filteredOptions, highlightedIndex]);

  const handleSelect = (optionValue: T) => {
    if (multiple) {
      const newValue = currentValue.includes(optionValue)
        ? currentValue.filter((v) => v !== optionValue)
        : [...currentValue, optionValue];
      onChange(newValue as T | T[]);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  };

  const removeValue = (optionValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = currentValue.filter((v) => v !== optionValue);
    onChange(multiple ? newValue : undefined);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : undefined);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setHighlightedIndex(-1);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    if (!isOpen && !disabled) {
      setIsOpen(true);
    }
  };

  const selectedOptions = options.filter((opt) => currentValue.includes(opt.value));
  const displayValue = multiple
    ? selectedOptions.map((o) => o.label).join(', ')
    : selectedOptions[0]?.label;

  const dropdownContent = (
    <div
      className={cn(
        'absolute top-full left-0 right-0 z-50 mt-1.5 bg-white rounded-xl border shadow-elevated',
        'animate-slide-down max-h-60 overflow-hidden',
        error ? 'border-red-300' : 'border-bakery-200'
      )}
      role="listbox"
      aria-multiselectable={multiple}
      ref={optionsRef}
    >
      {searchable && (
        <div className="p-2 border-b border-bakery-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bakery-400" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="input pl-10"
              autoComplete="off"
              aria-label="Buscar opciones"
            />
          </div>
        </div>
      )}

      <ul className="max-h-[300px] overflow-y-auto" role="presentation">
        {filteredOptions.length === 0 ? (
          <li className="px-3 py-4 text-center text-bakery-400 text-sm">
            {searchQuery ? 'Sin resultados' : 'Sin opciones disponibles'}
          </li>
        ) : (
          filteredOptions.map((option, index) => {
            const isSelected = currentValue.includes(option.value);
            const isHighlighted = index === highlightedIndex;
            const isDisabled = option.disabled;

            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                className={cn(
                  'px-3 py-2.5 cursor-pointer transition-colors flex items-center gap-2',
                  'hover:bg-bakery-50 focus:bg-bakery-50',
                  isSelected && 'bg-bakery-50 text-bakery-900 font-medium',
                  isHighlighted && 'bg-bakery-50',
                  isDisabled && 'opacity-50 cursor-not-allowed text-bakery-400'
                )}
                onClick={() => !isDisabled && handleSelect(option.value)}
                onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
              >
                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-bakery-600 flex-shrink-0" />
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div className={cn('w-full', className)} ref={selectRef}>
      {label && (
        <label className="label" htmlFor={name}>
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={name}
          onClick={toggleOpen}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? undefined : ariaLabel}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={cn(
            'btn btn-secondary w-full justify-between text-left',
            'focus:ring-2 focus:ring-bakery-500 focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-300 focus:ring-red-500',
            multiple && 'min-h-[44px] px-3 py-2'
          )}
        >
          {multiple ? (
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-h-[28px]">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt) => (
                  <span
                    key={String(opt.value)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-bakery-100 text-bakery-700 rounded-full"
                  >
                    {opt.label}
                    <button
                      type="button"
                      onClick={(e) => removeValue(opt.value, e)}
                      className="p-0.5 hover:bg-bakery-200 rounded hover:text-bakery-900"
                      aria-label={`Quitar ${opt.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-bakery-400">{placeholder}</span>
              )}
              {selectedOptions.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 p-0.5 text-bakery-400 hover:text-bakery-600 rounded"
                  aria-label="Limpiar todo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <span className={cn('flex-1 truncate', displayValue ? '' : 'text-bakery-400')}>
              {displayValue || placeholder}
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-bakery-400 flex-shrink-0 ml-2 transition-transform',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen && createPortal(dropdownContent, document.body)}

        {error && (
          <p id={`${name}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${name}-hint`} className="mt-1.5 text-sm text-bakery-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

// Select simple para casos básicos
export function SimpleSelect<T = string>({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  error,
  hint,
  name,
  className,
}: Omit<SelectProps<T>, 'multiple' | 'searchable'>) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      multiple={false}
      searchable={false}
      disabled={disabled}
      required={required}
      error={error}
      hint={hint}
      name={name}
      className={className}
    />
  );
}

// Select con búsqueda
export function SearchableSelect<T = string>({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  error,
  hint,
  name,
  className,
}: Omit<SelectProps<T>, 'multiple' | 'searchable'>) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      multiple={false}
      searchable={true}
      disabled={disabled}
      required={required}
      error={error}
      hint={hint}
      name={name}
      className={className}
    />
  );
}

// Select múltiple
export function MultiSelect<T = string>({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  error,
  hint,
  name,
  searchable = true,
  className,
}: Omit<SelectProps<T>, 'multiple'>) {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      multiple={true}
      searchable={searchable}
      disabled={disabled}
      required={required}
      error={error}
      hint={hint}
      name={name}
      className={className}
    />
  );
}