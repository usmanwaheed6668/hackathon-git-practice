const TONES = {
  neutral: 'bg-raised text-muted border-border',
  accent: 'bg-accent/[0.12] text-accent-hover border-accent/25',
  success: 'bg-success/[0.12] text-success border-success/25',
  warning: 'bg-warning/[0.12] text-warning border-warning/25',
  danger: 'bg-danger/[0.12] text-danger border-danger/25',
};

export default function Badge({ tone = 'neutral', dot = false, mono = false, className = '', children }) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium ${
        mono ? 'font-mono text-[11px]' : ''
      } ${TONES[tone] || TONES.neutral} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
