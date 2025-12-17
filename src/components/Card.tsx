import React from 'react';
import { CardProps } from '../types';
import { cn } from '../lib/utils';

const Card = React.forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, hover = true, onClick, ...props }, ref) => {
    const baseClasses = [
      'bg-background-secondary',
      'rounded-lg',
      'p-lg md:p-md',
      'shadow-card',
      'transition-all duration-normal',
    ];

    const hoverClasses = hover ? [
      'hover:shadow-card-hover',
      'hover:-translate-y-2',
      'hover:-rotate-0.5',
    ] : [];

    const clickableClasses = onClick ? [
      'cursor-pointer',
    ] : [];

    const classes = cn(
      baseClasses,
      hoverClasses,
      clickableClasses,
      className
    );

    return (
      <div
        ref={ref}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };