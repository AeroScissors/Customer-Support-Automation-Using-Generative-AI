import "./overviewSections.css";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";

import { BarChart3 } from "lucide-react";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,18,40,0.97)",
      border: "1px solid rgba(76,195,255,0.2)",
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
  (data || []).forEach(d => { map[d.date] = d.count; });

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    result.push({ date: label, count: map[key] ?? 0 });
  }
  return result;
}

export default function AnalyticsCard({ metrics, loading }) {
  const rawData = metrics?.ticket_volume_trend || [];
  const data = pad7Days(rawData); // ✅ always 7 days

  const resolutionData = [
    {
      type: "This Week",
      ai: metrics?.resolution_breakdown?.find(i => i.type === "AI_RESOLVED")?.count || 0,
      escalated: metrics?.resolution_breakdown?.find(i => i.type === "ESCALATED")?.count || 0,
    },
  ];

  return (
    <div
      className="analytics-card glass-card"
      style={{ transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 30px 80px rgba(0,0,0,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <div className="card-header"><BarChart3 size={18} /><h3>Analytics</h3></div>
      <div className="card-divider" />

      {/* Area Chart — 7 day ticket volume */}
      <div className="analytics-line">
        {loading ? <Skeleton height={220} /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4cc9f0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4cc9f0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(76,195,255,0.15)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="count" name="Tickets"
                stroke="#4cc9f0" strokeWidth={3} fill="url(#volGrad)"
                dot={{ r: 3, fill: "#4cc9f0", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#4cc9f0", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar Chart */}
      <div className="analytics-bar">
        {loading ? <Skeleton height={140} /> : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={resolutionData} barGap={8}>
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4cc9f0" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4cc9f0" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="escGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b6cff" stopOpacity={1} />
                  <stop offset="100%" stopColor="#9b6cff" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="type" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#8faac6" }} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="ai" name="AI Resolved" fill="url(#aiGrad)" radius={[6,6,0,0]} barSize={44} />
              <Bar dataKey="escalated" name="Escalated" fill="url(#escGrad)" radius={[6,6,0,0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="analytics-legend">
        <div><span className="legend-dot ai-dot" />AI Resolved</div>
        <div><span className="legend-dot human-dot" />Escalated</div>
      </div>
    </div>
  );
}