import "./overviewSections.css";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { BarChart3 } from "lucide-react";

export default function AnalyticsCard({ metrics, loading }) {
  // 🔥 REAL BACKEND DATA
  const data = metrics?.ticket_volume_trend || [];

  // 🔥 TRANSFORMED DATA FOR BAR CHART (Comparison)
  const resolutionData = [
    {
      type: "This Week",
      ai:
        metrics?.resolution_breakdown?.find(
          (item) => item.type === "AI_RESOLVED"
        )?.count || 0,
      escalated:
        metrics?.resolution_breakdown?.find(
          (item) => item.type === "ESCALATED"
        )?.count || 0,
    },
  ];

  return (
    <div className="analytics-card glass-card">
      {/* Header */}
      <div className="card-header">
        <BarChart3 size={18} />
        <h3>Analytics</h3>
      </div>

      <div className="card-divider" />

      {/* Line Chart (Ticket Volume Trend) */}
      <div className="analytics-line">
        {/* 🔥 FIXED HEIGHT: 220px */}
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="#8faac6"
              tick={{ fontSize: 11 }}
            />
            <YAxis stroke="#8faac6" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,25,45,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4cc9f0"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart (Resolution Breakdown) */}
      <div className="analytics-bar">
        {/* 🔥 FIXED HEIGHT: 160px */}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={resolutionData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />

            <XAxis
              dataKey="type"
              stroke="#8faac6"
              tick={{ fontSize: 10 }}
            />

            <YAxis stroke="#8faac6" tick={{ fontSize: 10 }} />

            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4cc9f0" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4cc9f0" stopOpacity={0.2} />
              </linearGradient>

              <linearGradient id="escGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b6cff" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#9b6cff" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <Bar
              dataKey="ai"
              fill="url(#aiGradient)"
              radius={[6, 6, 0, 0]}
              barSize={40} 
            />

            <Bar
              dataKey="escalated"
              fill="url(#escGradient)"
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="analytics-legend">
        <div>
          <span className="legend-dot ai-dot" />
          AI Resolved
        </div>
        <div>
          <span className="legend-dot human-dot" />
          Escalated
        </div>
      </div>
    </div>
  );
}