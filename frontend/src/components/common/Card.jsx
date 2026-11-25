export default function Card({ as: Component = 'div', className = '', padded = true, interactive = false, children, ...rest }) {
  return (
    <Component
      className={`rounded-card border border-border bg-surface ${padded ? 'p-5' : ''} ${
        interactive ? 'transition-all duration-200 hover:border-[#2F3746] hover:bg-raised' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-4 flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
