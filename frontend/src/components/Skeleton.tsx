import "./Skeleton.css";

interface SkeletonProductGridProps {
  count?: number;
}

export function SkeletonProductCard() {
  return (
    <div className="skeleton-product-card">
      <div className="skeleton skeleton-product-image" />
      <div className="skeleton-product-info">
        <div className="skeleton skeleton-product-title" />
        <div className="skeleton skeleton-product-desc" />
        <div className="skeleton skeleton-product-price" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: SkeletonProductGridProps) {
  return (
    <div className="skeleton-products-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton skeleton-stat-icon" />
      <div className="skeleton-stat-info">
        <div className="skeleton skeleton-stat-label" />
        <div className="skeleton skeleton-stat-value" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}
