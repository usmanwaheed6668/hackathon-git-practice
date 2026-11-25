import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, isOpen, onClose, title, children, footer, size = 'md', maxWidth }) {
  const isVisible = open ?? isOpen ?? false;
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const focusable = panelRef.current?.querySelector(
        'input, textarea, select, button:not([data-close])'
      );
      (focusable || panelRef.current)?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      previous?.focus?.();
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;
  const width = maxWidth || (size === 'xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-[rgba(14,16,19,0.75)] backdrop-blur-[8px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full ${width} animate-page-in overflow-y-auto rounded-t-2xl border border-[#2F3746] bg-surface shadow-[0_16px_40px_rgba(0,0,0,0.65)] focus:outline-none sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="focus-ring rounded-control p-1 text-muted hover:bg-raised hover:text-white"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
