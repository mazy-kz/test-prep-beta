import * as React from 'react';
import { buttonClasses } from './button';
import { cn } from '@/lib/cn';

export type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: Array<SegmentedControlOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={buttonClasses({
              variant: isActive ? 'primary' : 'ghost',
              size: 'md',
              active: isActive,
              className: 'flex-1 min-w-[5rem] sm:flex-none px-4 py-2 text-sm rounded-2xl',
            })}
          >
            <span className="flex flex-col items-center text-center">
              <span className={cn('font-semibold leading-tight', isActive ? 'text-white' : 'text-slate-900')}>{option.label}</span>
              {option.description ? (
                <span
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isActive ? 'text-blue-100' : 'text-slate-600'
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
