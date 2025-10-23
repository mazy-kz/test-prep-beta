import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type AlertVariant = 'info' | 'success' | 'error';

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-rose-50 text-rose-800 border-rose-200',
};

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm shadow-sm',
        variantStyles[variant],
        className,
      )}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {title ? <div className="font-semibold mb-1">{title}</div> : null}
      {children}
    </div>
  );
}
