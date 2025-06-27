// s_dashboard/components/UI/Button.tsx
import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';


const cn = (...args:string[])=>args.join(' ');


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  asChild = false,
  ...props
}) => {
  const baseStyles = `inline-flex items-center justify-center font-semibold text-center align-middle whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`;

  const variantStyles = {
    primary: "bg-blue-600 text-blue-50 hover:bg-blue-600/90",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    danger: "bg-red-600 text-red-50 hover:bg-red-600/90 dark:bg-red-800 dark:hover:bg-red-800/90",
    link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline",
  };

  const sizeStyles = {
    sm: "h-9 px-3",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10",
  };

  const combinedClasses = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    isLoading ? 'cursor-wait' : '',
    className
  );
  
  const Tag = asChild ? React.Fragment : 'button';
  const tagProps = asChild ? {} : props;


  const ButtonContent = () => (
    <>
      {isLoading && <Loader2 className={`animate-spin ${children ? 'mr-2' : ''} h-4 w-4`} />}
      {!isLoading && leftIcon && <span className={children ? 'mr-2' : ''}>{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className={children ? 'ml-2' : ''}>{rightIcon}</span>}
    </>
  );

  if (asChild && children) {
    return children
  }

  return (
    <button
      type="button"
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...tagProps}
    >
      <ButtonContent />
    </button>
  );
};