import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import TopBar from "./TopBar";
import TicketQueue from "./TicketQueue";
import TicketDetail from "./TicketDetail";
import AIInsightPanel from "./AIInsightPanel";

// ✅ Step 2: Updated import to use getAgentTicketMetrics
import { getAgentTicketMetrics } from "../../services/api";

const BASE_URL = "http://127.0.0.1:8000";

export default function AgentDashboard() {
  const navigate = useNavigate();

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [draftReply, setDraftReply] = useState("");

  // 🧱 Lifted state: The full object of the currently viewed ticket
  const [activeTicket, setActiveTicket] = useState(null);

  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // 🧱 Add refreshKey state to force child re-renders (specifically the Queue)
  const [refreshKey, setRefreshKey] = useState(0);

  // 🧱 Function to increment key and trigger data refresh
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchMetrics();
  };

  // 🔐 Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  // ✅ Updated fetchMetrics to use the specific ticket metrics endpoint
  const fetchMetrics = () => {
    setLoadingMetrics(true);
    getAgentTicketMetrics()
      .then(setMetrics)
      .catch((err) => {
        console.error("Failed to fetch ticket metrics", err);
      })
      .finally(() => setLoadingMetrics(false));
  };

  // 📊 Fetch ticket metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  // 💓 STEP 3: Agent Dashboard Auto-Ping (Heartbeat)
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch(`${BASE_URL}/agent/ping`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("access_token")}`
          }
        });
      } catch (err) {
        console.error("Ping failed", err);
      }
    };

    ping(); // Initial ping
    const interval = setInterval(ping, 20000); // every 20 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ✅ Top bar OUTSIDE the main layout wrapper */}
      <TopBar onLogout={handleLogout} />

      {/* ✅ Main layout wrapper with adjusted height calculation */}
      <Box 
        className="agent-dashboard-wrapper"
        sx={{
          height: "calc(100vh - 64px)", 
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
        }}
      >
        {/* ===================== */}
        {/* Agent Metrics Strip */}
        {/* ===================== */}
        <Box sx={{ px: 3, pt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
            }}
          >
            {[
              { label: "Open Escalations", key: "open" },
              { label: "Total Escalated", key: "total_escalated" },
              { label: "Resolved", key: "resolved" },
              { label: "Closed", key: "closed" },
            ].map((item) => (
              <Paper
                key={item.key}
                className="glass-card"
                sx={{
                  p: 2,
                  background: "rgba(22,35,55,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                }}
              >
                <Typography
                  fontSize={12}
                  fontWeight={600}
                  color="#9fb3c8"
                  mb={0.5}
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  {item.label}
                </Typography>

                <Typography
                  fontSize={28}
                  fontWeight={700}
                  color="#e6f1ff"
                  sx={{ textShadow: "0 0 15px rgba(76,195,255,0.3)" }}
                >
                  {loadingMetrics
                    ? "—"
                    : metrics?.[item.key] ?? 0}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* ===================== */}
        {/* Main dashboard layout */}
        {/* ===================== */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden", 
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr) 360px",
            gap: 3,
            padding: 3,
          }}
        >
          {/* 🧱 TicketQueue uses refreshKey to reload list when updates happen */}
          <TicketQueue
            key={refreshKey}
            selectedTicketId={selectedTicketId}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setDraftReply("");
            }}
          />

          {/* 🧱 TicketDetail populates the 'activeTicket' state for the whole dashboard */}
          <TicketDetail
            selectedTicketId={selectedTicketId}
            draftReply={draftReply}
            onDraftChange={setDraftReply}
            onTicketUpdated={triggerRefresh}
            onTicketLoaded={setActiveTicket}
          />

          {/* 🧱 Step 5: AIInsightPanel now consumes the full 'activeTicket' object */}
          <AIInsightPanel
            ticket={activeTicket}
            onUseSuggestion={(text) => setDraftReply(text)}
          />
        </Box>
      </Box>
    </>
  );
}