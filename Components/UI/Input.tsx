// s_dashboard/components/UI/Input.tsx
import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

const cn = (...args:string[])=>args.join(' ');

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'as'> {
  icon?: LucideIcon | React.ReactNode;
  label?: string;
  error?: string | null;
  containerClassName?: string;
  as?: 'input' | 'textarea';
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ icon: IconComponent, label, id, error, className = '', containerClassName = '', as: Component = 'input', ...props }, ref) => {
    
    const baseInputClasses = "flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-blue-400 dark:focus:ring-offset-slate-900";
    const errorClasses = "border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400";
    const iconPaddingClass = IconComponent ? 'pl-10' : '';

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label htmlFor={id || props.name} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {IconComponent && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.isValidElement(IconComponent) ? IconComponent : typeof IconComponent == 'function'?<IconComponent size={16} className="text-slate-400" />:''}
            </div>
          )}
          <Component
            id={id || props.name}
            className={cn(
              baseInputClasses,
              iconPaddingClass,
              error ? errorClasses : '',
              Component === 'textarea' ? 'h-24 min-h-[80px]' : '', // Styles spécifiques pour textarea
              className
            )}
            ref={ref as any}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';