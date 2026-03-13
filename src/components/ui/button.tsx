import * as React from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonClassesOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  className?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white border-transparent hover:bg-blue-700 focus-visible:outline-blue-600',
  secondary:
    'bg-slate-100 text-slate-900 border-transparent hover:bg-slate-200 focus-visible:outline-blue-600',
  outline:
    'bg-white text-slate-900 border-slate-300 hover:bg-slate-50 focus-visible:outline-blue-600',
  ghost:
    'bg-transparent text-slate-900 border-transparent hover:bg-blue-50 focus-visible:outline-blue-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

export function buttonClasses(options: ButtonClassesOptions = {}) {
  const { variant = 'primary', size = 'md', active, className } = options;
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl border font-medium no-underline transition-colors transition-shadow duration-150 shadow-sm hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60',
    sizeStyles[size],
    variantStyles[variant],
    active ? 'ring-2 ring-offset-2 ring-blue-500' : null,
    className,
  );
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', active, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, active, className })}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
