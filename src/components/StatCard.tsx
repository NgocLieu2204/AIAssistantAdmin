import type { ReactNode } from 'react';

interface StatCardProps {
  value: number | string;
  label: string;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  gradient: string;
  badgeText?: string;
  badgeColor?: string;
}

export default function StatCard({
  value, label, icon, iconColor, iconBg, gradient, badgeText, badgeColor
}: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--card-gradient': gradient } as React.CSSProperties}>
      <div className="stat-card-header">
        <div
          className="stat-card-icon"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {badgeText && (
          <span
            className="stat-card-badge"
            style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
