export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-control bg-raised ${className}`} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className = 'h-32', grid = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' }) {
  return (
    <div className={`grid gap-4 ${grid}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`rounded-card ${className}`} />
      ))}
    </div>
  );
}
