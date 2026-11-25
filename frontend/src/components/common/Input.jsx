import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

/** Text input / textarea with label, hint and error. Set `as="textarea"` for multi-line. */
const Input = forwardRef(function Input(
  { label, error, hint, id, as = 'input', className = '', rightSlot, labelRight, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const Component = as;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={className}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={inputId} className="label">
              {label}
            </label>
          )}
          {labelRight}
        </div>
      )}
      <div className="relative">
        <Component
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`field ${error ? 'field-error' : ''} ${rightSlot ? 'pr-11' : ''} ${
            as === 'textarea' ? 'min-h-[96px] resize-y' : ''
          }`}
          {...rest}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
