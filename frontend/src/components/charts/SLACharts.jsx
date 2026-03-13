import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "rgba(11, 18, 32, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "8px 12px",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "12px",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, color: payload[0].color }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// --- Chart 1: SLA Breaches (Orange/Red) ---
export const SLABreachChart = ({ data }) => {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "250px" }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBreach" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9f43" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff9f43" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9aa4b2", fontSize: 10 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9aa4b2", fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="breaches"
            name="Breaches"
            stroke="#ff9f43"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBreach)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Chart 2: Backlog Growth (Red/Gradient) ---
export const BacklogGrowthChart = ({ data }) => {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "250px" }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorBacklog" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff5c5c" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff5c5c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9aa4b2", fontSize: 10 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9aa4b2", fontSize: 10 }}
            domain={['dataMin - 10', 'auto']} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="tickets"
            name="Backlog"
            stroke="#ff5c5c"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBacklog)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};