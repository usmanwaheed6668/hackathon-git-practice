import { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  { label, error, id, options = [], className = '', placeholder, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={`field appearance-none pr-9 ${error ? 'field-error' : ''}`}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle size={13} />
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
