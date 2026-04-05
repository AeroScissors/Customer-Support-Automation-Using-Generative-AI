// File: frontend/src/dashboards/AgentDashboard/AgentDashboard.jsx

import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

import TopBar from "../../components/ui/TopBar";
import TicketQueue from "./TicketQueue";
import TicketDetail from "./TicketDetail";
import AIInsightPanel from "./AIInsightPanel";

import { getAgentTicketMetrics, pingAgent } from "../../services/api";

export default function AgentDashboard() {
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [draftReply, setDraftReply] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchMetrics();
  };

  const fetchMetrics = () => {
    setLoadingMetrics(true);
    getAgentTicketMetrics()
      .then(setMetrics)
      .catch((err) => console.error("Failed to fetch ticket metrics", err))
      .finally(() => setLoadingMetrics(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // ✅ Correct heartbeat using API layer
  useEffect(() => {
    pingAgent(); // immediate ping

    const interval = setInterval(() => {
      pingAgent();
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <TopBar role="agent" />

      <Box
        className="agent-dashboard-wrapper"
        sx={{
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
        }}
      >
        {/* Metrics strip */}
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
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {item.label}
                </Typography>

                <Typography
                  fontSize={28}
                  fontWeight={700}
                  color="#e6f1ff"
                  sx={{
                    textShadow: "0 0 15px rgba(76,195,255,0.3)",
                  }}
                >
                  {loadingMetrics ? "—" : metrics?.[item.key] ?? 0}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Main layout */}
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
          <TicketQueue
            key={refreshKey}
            selectedTicketId={selectedTicketId}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setDraftReply("");
            }}
          />

          <TicketDetail
            selectedTicketId={selectedTicketId}
            draftReply={draftReply}
            onDraftChange={setDraftReply}
            onTicketUpdated={triggerRefresh}
            onTicketLoaded={setActiveTicket}
          />

          <AIInsightPanel
            ticket={activeTicket}
            onUseSuggestion={(text) => setDraftReply(text)}
          />
        </Box>
      </Box>
    </>
  );
}