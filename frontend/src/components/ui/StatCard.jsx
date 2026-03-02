import {
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function StatCard({
  title,
  value,
  delta,
  danger = false,
  variant = "blue", // blue | purple | red | green | cyan
  icon: Icon,
}) {
  return (
    <div className={`stat-card stat-${variant}`}>
      {/* Left Icon Section */}
      <div className="stat-icon-wrapper">
        {Icon && <Icon size={22} className="stat-icon" />}
      </div>

      {/* Right Content */}
      <div className="stat-content">
        <div className="stat-title">{title}</div>

        <div className="stat-value">
          {value ?? "—"}
        </div>

        {delta && (
          <div
            className={`stat-delta ${
              danger ? "stat-delta-down" : "stat-delta-up"
            }`}
          >
            {danger ? (
              <ArrowDownRight size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}
            <span>{delta}</span>
          </div>
        )}
      </div>

      {/* Glow Layer */}
      <div className="stat-glow" />
    </div>
  );
}
