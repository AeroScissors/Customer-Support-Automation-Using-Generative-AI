import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function EscalationRateChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
            dataKey="week" 
            stroke="#64748b" 
            tick={{fontSize: 12}} 
            tickLine={false} 
            axisLine={false} 
        />
        <YAxis 
            stroke="#64748b" 
            tick={{fontSize: 12}} 
            tickFormatter={(val) => `${val}%`} 
            tickLine={false} 
            axisLine={false} 
        />
        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />

        {/* Escalation - Orange Glow */}
        <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#fbbf24" 
            strokeWidth={3} 
            dot={{ r: 5, fill: "#fbbf24", stroke: "#fff", strokeWidth: 2 }}
            style={{ filter: 'drop-shadow(0px 0px 10px rgba(251, 191, 36, 0.6))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}