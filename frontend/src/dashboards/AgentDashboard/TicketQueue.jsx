import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
} from "@mui/material";

import { getTickets } from "../../services/api";

export default function TicketQueue({
  selectedTicketId,
  onSelectTicket,
  refreshTrigger, // ✅ FIX: Parent increments this when a ticket is updated/closed
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // ✅ FIX: Wrapped in useCallback so it's stable and can be called on demand
  const loadTickets = useCallback(async () => {
    try {
      const data = await getTickets();

      setTickets(data);

      // Auto-select first non-closed ticket if nothing is selected
      if (!selectedTicketId && data.length > 0) {
        const firstOpen = data.find((t) => t.status !== "CLOSED");
        if (firstOpen) {
          onSelectTicket(firstOpen.ticket_id);
        }
      }

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0 });
      });

    } catch (error) {
      console.error("Failed to load tickets:", error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTicketId, onSelectTicket]);

  // ✅ FIX: Re-fetch whenever refreshTrigger changes (parent bumps it after send/close)
  useEffect(() => {
    setLoading(true);
    loadTickets();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIX: Derive status color — now handles HUMAN_RESOLVED too
  function getStatusColor(status) {
    switch (status) {
      case "ESCALATED":    return "#ff9f43";
      case "HUMAN_RESOLVED": return "#26de81";
      case "AI_RESOLVED":  return "rgba(255,255,255,0.4)";
      case "CLOSED":       return "rgba(255,255,255,0.2)";
      default:             return "rgba(255,255,255,0.4)";
    }
  }

  return (
    <Box
      className="glass-card"
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 3,
        padding: 2.5,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Header */}
      <Typography
        variant="subtitle2"
        sx={{ 
          mb: 2, 
          color: "text.secondary", 
          fontWeight: 700, 
          letterSpacing: 1.5 
        }}
      >
        TICKET QUEUE
      </Typography>

      {/* Loading */}
      {loading && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Loading tickets…
        </Typography>
      )}

      {/* Empty */}
      {!loading && tickets.length === 0 && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          No tickets available
        </Typography>
      )}

      {/* Ticket list */}
      {!loading && tickets.length > 0 && (
        <Box
          ref={scrollRef}
          className="ticket-queue-scroll"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 0.5,
          }}
        >
          <List
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {tickets.map((ticket) => {
              const isActive    = ticket.ticket_id === selectedTicketId;
              const isClosed    = ticket.status === "CLOSED";
              const isEscalated = ticket.status === "ESCALATED";
              // ✅ FIX: Correctly detect human-resolved tickets
              const isHumanResolved = ticket.status === "HUMAN_RESOLVED";

              const preview =
                ticket.messages?.[0]?.content ??
                "No message available";

              return (
                <ListItem
                  key={ticket.ticket_id}
                  disableGutters
                  onClick={() => onSelectTicket(ticket.ticket_id)}
                  className={`ticket-item ${isActive ? "active" : ""} ${isEscalated ? "escalated" : ""}`}
                  sx={{
                    px: 2,
                    py: 2,
                    borderRadius: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    opacity: isClosed ? 0.5 : 1,
                    transition: "all 0.3s ease",
                    bgcolor: "transparent",
                    border: "1px solid rgba(255,255,255,0.05)",
                    "&:hover": {
                        bgcolor: "rgba(255,255,255,0.03)"
                    }
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: isClosed ? "text.disabled" : "#fff",
                        fontSize: "0.85rem"
                      }}
                    >
                      {preview}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}
                      >
                        ID: {ticket.ticket_id.slice(-6).toUpperCase()}
                      </Typography>

                      {/* ✅ FIX: Status uses helper for correct color per status */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: getStatusColor(ticket.status),
                          fontWeight: 500,
                          fontSize: "0.7rem"
                        }}
                      >
                        • {ticket.status}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ✅ FIX: Orange dot only for ESCALATED, green dot for HUMAN_RESOLVED */}
                  {isEscalated && (
                    <Box 
                        sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: '#ff9f43', 
                            ml: 1, 
                            mt: 1,
                            boxShadow: '0 0 10px #ff9f43' 
                        }} 
                    />
                  )}
                  {isHumanResolved && (
                    <Box 
                        sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: '#26de81', 
                            ml: 1, 
                            mt: 1,
                            boxShadow: '0 0 10px #26de81' 
                        }} 
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}