import "../../styles/dashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import StatCard from "../../components/ui/StatCard";
import { getAdminAnalytics } from "../../services/api";

import AnalyticsCard from "./OverviewSections/AnalyticsCard";
import SLACard from "./OverviewSections/SLACard";
import KnowledgeBaseCard from "./OverviewSections/KnowledgeBaseCard";

import { Ticket, Brain, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ✅ Determine if delta is negative (danger) based on value string
function isDanger(delta) {
  return delta?.startsWith("-");
}

export default function Overview() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAdminAnalytics()
      .then(setMetrics)
      .catch((err) => {
        console.error("Failed to load admin analytics", err);
        if (err.message?.includes("401") || err.message?.includes("403")) {
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("role");
          navigate("/", { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const totalTickets      = metrics?.total_tickets ?? 0;
  const aiResolvedPct     = totalTickets > 0 ? Math.round((metrics.ai_resolved_count / totalTickets) * 100) : 0;
  const escalationPct     = totalTickets > 0 ? Math.round((metrics.escalated_count / totalTickets) * 100) : 0;
  const avgConfidence     = metrics?.avg_confidence != null ? `${Math.round(metrics.avg_confidence * 100)}%` : "—";
  const avgResolutionTime = metrics?.avg_resolution_time != null
    ? metrics.avg_resolution_time === 0
      ? "N/A"
      : `${metrics.avg_resolution_time.toFixed(1)} min`
    : "—";

  // ✅ Real deltas from backend
  const deltaTickets    = metrics?.delta_tickets    ?? "+0.0%";
  const deltaAiResolved = metrics?.delta_ai_resolved ?? "+0.0%";
  const deltaEscalation = metrics?.delta_escalation  ?? "+0.0%";

  return (
    <div className="overview-wrapper">

      {/* ✅ Greeting header */}
      <div style={{
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
      }}>
        <div>
          <div style={{
            fontSize: 22, fontWeight: 700, color: "#e6f1ff",
            letterSpacing: "-0.02em",
          }}>
            {getGreeting()}, Admin 👋
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            {formatDate()}
          </div>
        </div>

        {/* Quick summary pill */}
        {!loading && metrics && (
          <div style={{
            display: "flex", gap: 12, alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "8px 16px",
            fontSize: 12, color: "rgba(255,255,255,0.5)",
          }}>
            <span>
              <span style={{ color: "#26de81", fontWeight: 700 }}>
                {metrics.total_resolved ?? (metrics.ai_resolved_count + (metrics.human_resolved_count ?? 0))}
              </span> resolved
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span>
              <span style={{ color: "#ff9f43", fontWeight: 700 }}>
                {metrics.escalated_count}
              </span> escalated
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span>
              <span style={{ color: "#5EB6FC", fontWeight: 700 }}>
                {metrics.sla_breaches}
              </span> SLA breaches
            </span>
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div className="stats-row">
        <StatCard title="Total Tickets" value={loading ? "—" : totalTickets.toLocaleString()} delta={deltaTickets} danger={isDanger(deltaTickets)} icon={Ticket} variant="blue" primary />
        <StatCard title="% AI Resolved" value={loading ? "—" : `${aiResolvedPct}%`} delta={deltaAiResolved} danger={isDanger(deltaAiResolved)} icon={Brain} variant="purple" />
        <StatCard title="Escalation Rate" value={loading ? "—" : `${escalationPct}%`} delta={deltaEscalation} danger={!isDanger(deltaEscalation)} icon={AlertTriangle} variant="red" pulse={escalationPct > 30} />
        <StatCard title="Avg. Confidence" value={loading ? "—" : avgConfidence} delta="+0.4%" icon={ShieldCheck} variant="green" />
        <StatCard title="Resolution Time" value={loading ? "—" : avgResolutionTime} delta="-0.1h" danger icon={Clock} variant="cyan" />
      </div>

      {/* Main Grid */}
      <div className="content-grid">
        <AnalyticsCard metrics={metrics} loading={loading} />
        <SLACard       metrics={metrics} loading={loading} />
        <KnowledgeBaseCard />
      </div>
    </div>
  );
}