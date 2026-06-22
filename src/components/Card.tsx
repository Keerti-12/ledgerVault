import React from 'react';
import { cn } from './Button';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-2xl shadow-sm border border-slate-100 p-5', className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
