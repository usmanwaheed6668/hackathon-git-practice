import { forwardRef } from 'react';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-pressed active:bg-accent-pressed',
  secondary: 'bg-raised text-body border border-[#2A313B] hover:bg-border hover:border-accent',
  ghost: 'bg-transparent text-muted hover:bg-raised hover:text-white',
  danger: 'bg-danger/[0.12] text-danger border border-danger/25 hover:bg-danger hover:text-white',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`focus-ring inline-flex select-none items-center justify-center whitespace-nowrap rounded-control font-medium transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
});

export { Button };
export default Button;
