import React, { useEffect, useState } from "react";
import { 
  Clock, 
  AlertTriangle, 
  FolderOpen, 
  TrendingUp, 
  ShieldAlert 
} from "lucide-react";
import { getSLAMetrics } from "../../services/api"; 
import StatCard from "../../components/ui/StatCard"; 
import { SLABreachChart, BacklogGrowthChart } from "../../components/charts/SLACharts"; 

export default function SLA() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
    getSLAMetrics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="overview-wrapper">
      
      {/* 1. TOP ROW: 4 Stat Cards */}
      <div className="stats-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard
          title="Avg. Resolution Time"
          value={data?.avg_resolution_time || "4h 45m"}
          icon={Clock}
          variant="purple" // Fits the dark theme
        />
        <StatCard
          title="SLA Breach Count"
          value={data?.sla_breach_count || "0"}
          icon={AlertTriangle}
          variant="red" // Danger color
          danger={true}
        />
        <StatCard
          title="Backlog Size"
          value={data?.backlog_size || "0"}
          icon={FolderOpen}
          variant="blue" // Neutral/Info color
        />
        <StatCard
          title="Breach Rate Trend"
          value={`${data?.breach_rate_trend}%` || "0%"}
          delta={data?.breach_rate_delta || "0%"}
          icon={TrendingUp}
          variant="red" 
          danger={true} // Shows red arrow
        />
      </div>

      {/* 2. MIDDLE ROW: Charts */}
      <div className="sla-grid">
        {/* Chart 1: SLA Breaches */}
        <div className="glass-card">
          <div className="chart-header">
            <AlertTriangle size={18} color="#ff9f43" />
            <span className="chart-title">SLA Breaches</span>
          </div>
          <div style={{ height: "250px" }}>
            <SLABreachChart data={data?.breach_chart_data || []} />
          </div>
        </div>

        {/* Chart 2: Backlog Growth */}
        <div className="glass-card">
          <div className="chart-header">
            <TrendingUp size={18} color="#ff5c5c" />
            <span className="chart-title">Backlog Growth</span>
          </div>
          <div style={{ height: "250px" }}>
            <BacklogGrowthChart data={data?.backlog_chart_data || []} />
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Risk Panel */}
      <div className="risk-panel">
        <div className="risk-header">
          <ShieldAlert size={16} />
          <span>SLA Risk Assessment</span>
        </div>
        <div className="risk-title">
          Moderate risk: backlog increasing faster than resolution
        </div>
        <div className="risk-desc">
          Your backlog is growing faster than tickets are being resolved, increasing the risk of SLA breaches in the upcoming 48 hours. Recommended: Reallocate 2 senior agents to Triage.
        </div>
      </div>

    </div>
  );
}