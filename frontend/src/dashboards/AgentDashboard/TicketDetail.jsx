import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  TextField,
  Button,
} from "@mui/material";

import {
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} from "../../services/api";

export default function TicketDetail({
  selectedTicketId,
  draftReply,
  onDraftChange,
  onTicketUpdated,
  onTicketLoaded,
}) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const messagesEndRef = useRef(null);

  const isClosed = ticket?.status === "CLOSED";

  // --------------------------------------------------
  // Load ticket
  // --------------------------------------------------
  useEffect(() => {
    if (!selectedTicketId) {
      setTicket(null);
      onTicketLoaded?.(null);
      return;
    }

    async function loadTicket() {
      setLoading(true);
      try {
        const data = await getTicketById(selectedTicketId);
        setTicket(data);
        onTicketLoaded?.(data);
      } catch (error) {
        console.error("Failed to load ticket:", error.message);
        setTicket(null);
        onTicketLoaded?.(null);
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [selectedTicketId, onTicketLoaded]);

  // --------------------------------------------------
  // Auto-scroll on new messages
  // --------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  // --------------------------------------------------
  // Send agent message
  // --------------------------------------------------
  const handleSend = async () => {
    if (!draftReply?.trim() || !selectedTicketId || isClosed) return;

    try {
      setSending(true);

      const updated = await addTicketMessage(
        selectedTicketId,
        {
          sender: "agent",
          content: draftReply,
        }
      );

      // ✅ FIX: After agent sends a message, the ticket should show HUMAN_RESOLVED.
      // The backend /tickets/:id/message endpoint returns the updated ticket.
      // We also force status locally in case backend doesn't update it.
      const updatedWithStatus = {
        ...updated,
        status: updated.status === "ESCALATED" ? "HUMAN_RESOLVED" : updated.status,
      };

      setTicket(updatedWithStatus);
      onTicketLoaded?.(updatedWithStatus);
      onDraftChange("");
      onTicketUpdated?.(); // ✅ Triggers TicketQueue to re-fetch

    } catch (error) {
      console.error("Failed to send message:", error.message);
    } finally {
      setSending(false);
    }
  };

  // --------------------------------------------------
  // Close ticket
  // --------------------------------------------------
  const handleCloseTicket = async () => {
    if (!selectedTicketId || !ticket) return;

    try {
      setClosing(true);
      await updateTicketStatus(selectedTicketId, "CLOSED");

      // ✅ FIX: Was passing a function to setTicket — now correctly builds closed object
      const closedTicket = { ...ticket, status: "CLOSED" };
      setTicket(closedTicket);
      onTicketLoaded?.(closedTicket);
      onTicketUpdated?.(); // ✅ Triggers TicketQueue to re-fetch

    } catch (error) {
      console.error("Failed to close ticket:", error.message);
    } finally {
      setClosing(false);
    }
  };

  // --------------------------------------------------
  // Status chip styling
  // --------------------------------------------------
  function getChipStyle(status) {
    switch (status) {
      case "ESCALATED":
        return {
          bgcolor: "rgba(255, 159, 67, 0.15)",
          color: "#ff9f43",
          border: "1px solid #ff9f43",
        };
      case "HUMAN_RESOLVED":
        // ✅ FIX: Green chip for human-resolved — no longer shows AI_RESOLVED
        return {
          bgcolor: "rgba(38, 222, 129, 0.15)",
          color: "#26de81",
          border: "1px solid #26de81",
        };
      case "AI_RESOLVED":
        return {
          bgcolor: "rgba(94, 182, 252, 0.1)",
          color: "#5EB6FC",
          border: "1px solid rgba(94, 182, 252, 0.3)",
        };
      case "CLOSED":
        return {
          bgcolor: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
        };
      default:
        return {
          bgcolor: "rgba(255,255,255,0.05)",
          color: "inherit",
          border: "1px solid rgba(255,255,255,0.1)",
        };
    }
  }

  return (
    <Box
      className="glass-card ticket-detail-card"
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 3,
        padding: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.5 }}
        >
          TICKET DETAIL
        </Typography>

        {ticket && (
          <Chip
            label={ticket.status}
            size="small"
            sx={{ fontWeight: 600, ...getChipStyle(ticket.status) }}
          />
        )}
      </Box>

      {/* Empty state */}
      {!selectedTicketId && (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: '0.9rem' }}
            >
              Select a ticket to view details
            </Typography>
        </Box>
      )}

      {/* Loading */}
      {loading && (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Loading ticket…
        </Typography>
      )}

      {/* Chat Area */}
      {!loading && ticket && (
        <>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              pr: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {ticket.messages.map((msg, idx) => {
              const isAgent = msg.sender === "agent";
              return (
                <Box
                  key={idx}
                  sx={{
                    alignSelf: isAgent ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      mb: 0.5,
                      display: "block",
                      textAlign: isAgent ? "right" : "left",
                    }}
                  >
                    {isAgent ? "Agent" : "Customer"}
                  </Typography>

                  <Box
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      borderRadius: isAgent ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isAgent
                        ? "rgba(94, 182, 252, 0.1)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Section */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.08)" }} />

            <TextField
              multiline
              minRows={3}
              fullWidth
              placeholder={isClosed ? "Ticket is closed" : "Type your reply..."}
              value={draftReply}
              onChange={(e) => onDraftChange(e.target.value)}
              disabled={isClosed}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  bgcolor: "rgba(255,255,255,0.02)",
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "#5EB6FC" },
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSend}
                disabled={isClosed || sending || !draftReply.trim()}
                sx={{
                    bgcolor: "#5EB6FC",
                    color: "#000",
                    fontWeight: 700,
                    borderRadius: "10px",
                    textTransform: "none",
                    "&:hover": { bgcolor: "#4aa3e0" }
                }}
              >
                {sending ? "Sending..." : "Send Reply"}
              </Button>

              {!isClosed && (
                <Button
                  variant="outlined"
                  onClick={handleCloseTicket}
                  disabled={closing}
                  sx={{
                      color: "#ff5c5c",
                      borderColor: "rgba(255, 92, 92, 0.3)",
                      borderRadius: "10px",
                      textTransform: "none",
                      px: 3,
                      "&:hover": { borderColor: "#ff5c5c", bgcolor: "rgba(255, 92, 92, 0.05)" }
                  }}
                >
                  {closing ? "Closing..." : "Close"}
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}