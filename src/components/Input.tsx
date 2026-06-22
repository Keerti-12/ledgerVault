import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-sm font-semibold text-slate-700 ml-1">{label}</label>}
        <input
          ref={ref}
          className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white outline-none transition-all ${
            error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
              : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
          } ${className || ''}`}
          {...props}
        />
        {error && <p className="text-rose-500 text-sm ml-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
