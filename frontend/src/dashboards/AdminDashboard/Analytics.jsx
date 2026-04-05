import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

// API Imports
import {
  getAdminAnalytics,
  getTicketVolumeTrend,
  getConfidenceDistribution,
  getResolutionTrend, // 🔥 NEW IMPORT
  getEscalationTrend, // 🔥 NEW IMPORT
} from "../../services/api";

// Chart Imports
import TicketVolumeChart from "../../components/charts/TicketVolumeChart";
import AIvsHumanChart from "../../components/charts/AIvsHumanChart";
import ConfidenceDistributionChart from "../../components/charts/ConfidenceDistributionChart";
import EscalationRateChart from "../../components/charts/EscalationRateChart";

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [ticketTrendData, setTicketTrendData] = useState([]);
  const [confidenceBuckets, setConfidenceBuckets] = useState([]);
  
  // 🔥 NEW STATE for the wired-up charts
  const [resolutionTrend, setResolutionTrend] = useState([]);
  const [escalationTrend, setEscalationTrend] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ALL data points including the new ones
    Promise.all([
      getAdminAnalytics(),
      getTicketVolumeTrend(),
      getConfidenceDistribution(),
      getResolutionTrend(), // 🔥 Fetch Resolution Trend
      getEscalationTrend(), // 🔥 Fetch Escalation Trend
    ])
      .then(([analytics, ticketTrend, confidenceDist, resTrend, escTrend]) => {
        setMetrics(analytics);
        setTicketTrendData(ticketTrend);
        setConfidenceBuckets(confidenceDist);
        setResolutionTrend(resTrend); // 🔥 Set State
        setEscalationTrend(escTrend); // 🔥 Set State
      })
      .catch((err) => {
        console.error("Failed to load analytics data", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    // Height is 100% to fit inside Dashboard without double scrollbar
    <Box
      sx={{
        height: "100%", 
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grid Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, 
          gridTemplateRows: { md: "1fr 1fr" }, // Forces 2 equal rows
          gap: "24px",
          height: "100%", // Fill the available container height
          minHeight: 0,   // Critical: Prevents grid blow-out
        }}
      >
        
        {/* Card 1: Ticket Volume */}
        <Paper sx={panelStyle}>
          <PanelHeader title="Total Tickets" value={metrics?.total_tickets} />
          <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
            {loading ? <LoadingText /> : <TicketVolumeChart data={ticketTrendData} />}
          </Box>
        </Paper>

        {/* Card 2: AI vs Human (🔥 WIRED UP) */}
        <Paper sx={panelStyle}>
          <PanelHeader
            title="% AI Resolved vs Human Resolved"
            value={`${metrics?.ai_resolution_rate || 0}%`} // Overall rate from summary
          />
          <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
            {/* Pass the real resolution trend data */}
            {loading ? <LoadingText /> : <AIvsHumanChart data={resolutionTrend} />}
          </Box>
        </Paper>

        {/* Card 3: Confidence Distribution */}
        <Paper sx={panelStyle}>
          <PanelHeader title="Confidence Score Distribution" />
          <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
            {loading ? <LoadingText /> : <ConfidenceDistributionChart data={confidenceBuckets} />}
          </Box>
        </Paper>

        {/* Card 4: Escalation Rate (🔥 WIRED UP) */}
        <Paper sx={panelStyle}>
          <PanelHeader
            title="Escalation Rate"
            value={`${metrics?.escalation_rate || 0}%`} // Overall rate from summary
          />
          <Box sx={{ flex: 1, minHeight: 0, width: "100%" }}>
             {/* Pass the real escalation trend data */}
            {loading ? <LoadingText /> : <EscalationRateChart data={escalationTrend} />}
          </Box>
        </Paper>

      </Box>
    </Box>
  );
}

// --- Sub Components & Styles ---

function PanelHeader({ title, value }) {
  return (
    <Box 
      mb={1} 
      display="flex" 
      justifyContent="space-between" 
      alignItems="center"
    >
      <Typography fontSize={15} fontWeight={500} color="#94a3b8" sx={{ letterSpacing: '0.5px' }}>
         {title}
      </Typography>
      {value && (
        <Typography fontSize={24} fontWeight={600} color="#f8fafc" sx={{ textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>
          {value}
        </Typography>
      )}
    </Box>
  );
}

function LoadingText() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography fontSize={13} color="#64748b">
        Loading...
      </Typography>
    </Box>
  );
}

// Panel Style
const panelStyle = {
  p: 2.5,
  background: "rgba(13, 17, 28, 0.4)", // Highly transparent to let Dashboard BG show
  backdropFilter: "blur(12px)",        // Blur effect
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};