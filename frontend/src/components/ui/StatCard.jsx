import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const VARIANT_GLOW = {
  blue:   "rgba(76,195,255,0.4)",
  purple: "rgba(155,108,255,0.4)",
  red:    "rgba(255,92,92,0.4)",
  green:  "rgba(46,204,113,0.4)",
  cyan:   "rgba(0,217,255,0.4)",
};

export default function StatCard({
  title,
  value,
  delta,
  danger = false,
  variant = "blue",
  icon: Icon,
  primary = false,   // ✅ NEW: makes Total Tickets stand out
  pulse = false,     // ✅ NEW: subtle pulse for high escalation
}) {
  const glowColor = VARIANT_GLOW[variant] || VARIANT_GLOW.blue;

  return (
    <div
      className={`stat-card stat-${variant}`}
      style={{
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "default",
        // ✅ Primary card gets a top border accent
        ...(primary && {
          borderTop: `2px solid ${glowColor}`,
        }),
        // ✅ Pulse animation for danger cards
        ...(pulse && {
          animation: "cardPulse 2.5s ease-in-out infinite",
        }),
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
        e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${glowColor}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <style>{`
        @keyframes cardPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${glowColor}; }
          50% { box-shadow: 0 0 20px 4px ${glowColor}55; }
        }
      `}</style>

      {/* Icon */}
      <div className="stat-icon-wrapper">
        {Icon && <Icon size={primary ? 26 : 22} className="stat-icon" />}
      </div>

      {/* Content */}
      <div className="stat-content">
        <div className="stat-title" style={{
          fontSize: primary ? "13px" : undefined,
          fontWeight: primary ? 700 : undefined,
        }}>
          {title}
        </div>

        <div
          className="stat-value"
          style={{
            // ✅ Primary card value is larger
            fontSize: primary ? "52px" : undefined,
            letterSpacing: primary ? "-1px" : undefined,
          }}
        >
          {value ?? "—"}
        </div>

        {delta && (
          <div className={`stat-delta ${danger ? "stat-delta-down" : "stat-delta-up"}`}>
            {danger ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
            <span>{delta}</span>
          </div>
        )}
      </div>

      {/* Glow Layer */}
      <div className="stat-glow" />
    </div>
  );
}