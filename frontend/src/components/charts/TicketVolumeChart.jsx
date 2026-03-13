import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TicketVolumeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis 
            dataKey="label" 
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
        <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff" }} 
            itemStyle={{ color: "#38bdf8" }} 
        />
        
        {/* Glowing Area Effect */}
        <Area 
            type="monotone" 
            dataKey="tickets" // changed from "value" to match your file
            stroke="#38bdf8" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTickets)" 
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.5))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}