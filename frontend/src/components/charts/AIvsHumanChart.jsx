import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function AIvsHumanChart({ data }) {
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
            tickLine={false} 
            axisLine={false} 
        />
        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
        <Legend iconType="circle" />

        {/* AI Resolved - Teal Glow */}
        <Line 
            type="monotone" 
            dataKey="ai" 
            name="AI Resolved"
            stroke="#22d3ee" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(34, 211, 238, 0.5))' }}
        />

        {/* Human Resolved - Purple Glow */}
        <Line 
            type="monotone" 
            dataKey="human" 
            name="Human Resolved"
            stroke="#a78bfa" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(167, 139, 250, 0.5))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}