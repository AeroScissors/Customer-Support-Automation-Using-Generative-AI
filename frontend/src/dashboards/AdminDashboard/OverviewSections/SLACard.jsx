import "./overviewSections.css";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

import { AlertTriangle } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,18,40,0.97)",
      border: "1px solid rgba(255,92,92,0.2)",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}:</span>
          <span style={{ color: "#fff", fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Skeleton({ height = 200 }) {
  return (
    <div style={{
      height, borderRadius: 12,
      background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ✅ Always returns 7 days — fills missing days with 0
function pad7Days(data) {
  const map = {};
  (data || []).forEach(d => { map[d.date] = d.breaches; });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    result.push({ date: label, breaches: map[key] ?? 0 });
  }
  return result;
}

export default function SLACard({ metrics, loading }) {
  const rawData = metrics?.sla_trend || [];
  const trendData = pad7Days(rawData); // ✅ always 7 days

  const breaches = metrics?.sla_breaches ?? 0;
  const backlog  = metrics?.backlog ?? 0;

  const breachColor = breaches > 5 ? "#ff5c5c" : breaches > 0 ? "#ff9f43" : "#26de81";

  return (
    <div
      className="sla-card glass-card"
      style={{ transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 30px 80px rgba(0,0,0,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div className="card-header"><AlertTriangle size={18} /><h3>SLA</h3></div>
      <div className="card-divider" />

      <div className="sla-summary">
        <div className="sla-metric">
          <span className="sla-label">SLA Breaches</span>
          {loading
            ? <div style={{ height: 32, width: 40, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />
            : <span className="sla-value" style={{ color: breachColor, textShadow: `0 0 12px ${breachColor}66` }}>{breaches}</span>
          }
        </div>
        <div className="sla-metric">
          <span className="sla-label">Backlog</span>
          {loading
            ? <div style={{ height: 32, width: 40, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginTop: 4 }} />
            : <span className="sla-value" style={{ color: backlog > 10 ? "#ff9f43" : "#e6f1ff" }}>{backlog}</span>
          }
        </div>
      </div>

      <div className="sla-chart">
        {loading ? <Skeleton height={240} /> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="slaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5c5c" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ff5c5c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,92,92,0.15)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="breaches" name="Breaches"
                stroke="#ff5c5c" strokeWidth={3} fill="url(#slaGrad)"
                dot={{ r: 3, fill: "#ff5c5c", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#ff5c5c", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}