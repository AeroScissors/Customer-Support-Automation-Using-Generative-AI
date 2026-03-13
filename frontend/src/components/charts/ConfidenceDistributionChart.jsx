import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function ConfidenceDistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis 
            dataKey="bucket" 
            stroke="#64748b" 
            tick={{fontSize: 11}} 
            tickLine={false} 
            axisLine={false} 
        />
         <YAxis 
            stroke="#64748b" 
            tick={{fontSize: 11}} 
            tickLine={false} 
            axisLine={false} 
        />
        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
        
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data && data.map((entry, index) => (
             // Gradient effect per bar
            <Cell key={`cell-${index}`} fill={`url(#barGradient)`} />
          ))}
        </Bar>
        
        <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}