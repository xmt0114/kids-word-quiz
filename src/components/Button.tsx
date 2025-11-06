import React from 'react';
import { ButtonProps } from '../types';
import { cn } from '../lib/utils';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'default', 
    disabled = false, 
    className,
    ...props 
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-bold font-body',
      'transition-all duration-fast',
      'focus:outline-none focus:ring-4 focus:ring-primary-500 focus:ring-opacity-50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95',
    ];

    const variantClasses = {
      primary: [
        'bg-gradient-to-r from-primary-500 to-primary-600',
        'text-text-inverse',
        'border-3 border-white border-opacity-80',
        'shadow-button',
        'hover:shadow-lg hover:-translate-y-1',
        'hover:scale-105',
      ],
      secondary: [
        'bg-background-secondary',
        'text-primary-500',
        'border-3 border-primary-500',
        'hover:bg-primary-500 hover:text-text-inverse',
        'hover:shadow-md',
      ],
      success: [
        'bg-success',
        'text-text-inverse',
        'shadow-md',
        'hover:bg-opacity-90',
      ],
      error: [
        'bg-error',
        'text-text-inverse',
        'shadow-md',
        'hover:bg-opacity-90',
      ],
    };

    const sizeClasses = {
      default: [
        'min-h-button min-w-touch',
        'px-md py-sm',
        'text-button',
        'rounded-full',
      ],
      large: [
        'min-h-[64px] min-w-[180px]',
        'px-xl py-md',
        'text-h3',
        'rounded-full',
      ],
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        className={classes}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };