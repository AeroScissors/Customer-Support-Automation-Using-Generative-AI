import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  TextField,
  Button,
} from "@mui/material";

export default function AIInsightPanel({
  ticket,
  onUseSuggestion,
}) {
  const [editableReply, setEditableReply] = useState("");

  // Extract AI message from the messages array
  useEffect(() => {
    if (ticket?.messages) {
      const aiMessage = ticket.messages.find((m) => m.sender === "ai");
      setEditableReply(aiMessage?.content || "");
    } else {
      setEditableReply("");
    }
  }, [ticket]);

  // ---------- derived UI signals ----------
  const confidence    = ticket?.confidence_score ?? null;
  const decisionReason = ticket?.decision_reason || "No explanation provided";
  const status        = ticket?.status;

  // ✅ FIX: Tone logic now correctly maps all statuses
  // ESCALATED       → Apologetic (human needs to handle it carefully)
  // AI_RESOLVED     → Calm (AI handled it cleanly)
  // HUMAN_RESOLVED  → Professional (agent resolved it)
  const showApologetic     = status === "ESCALATED";
  const showCalm           = status === "AI_RESOLVED";
  const showProfessional   = status === "HUMAN_RESOLVED";  // ✅ FIX: was never shown before
  const showClear          = confidence !== null && confidence < 0.4;

  const handleUseReply = () => {
    if (!editableReply.trim()) return;
    onUseSuggestion?.(editableReply);
  };

  // ✅ FIX: Panel header shows resolved-by info
  function getResolvedByLabel() {
    if (status === "HUMAN_RESOLVED") return "Resolved by Agent";
    if (status === "AI_RESOLVED")    return "Resolved by AI";
    if (status === "CLOSED")         return "Ticket Closed";
    if (status === "ESCALATED")      return "Awaiting Agent";
    return null;
  }

  const resolvedByLabel = getResolvedByLabel();

  return (
    <Box
      className="glass-card ai-insight-card"
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1.5 }}
        >
          AI INSIGHT PANEL
        </Typography>

        {/* ✅ FIX: Shows resolved-by badge so agent knows who solved it */}
        {resolvedByLabel && (
          <Chip
            label={resolvedByLabel}
            size="small"
            sx={{
              fontSize: "0.65rem",
              fontWeight: 600,
              bgcolor: status === "HUMAN_RESOLVED"
                ? "rgba(38, 222, 129, 0.1)"
                : status === "AI_RESOLVED"
                  ? "rgba(94, 182, 252, 0.1)"
                  : "rgba(255,255,255,0.05)",
              color: status === "HUMAN_RESOLVED"
                ? "#26de81"
                : status === "AI_RESOLVED"
                  ? "#5EB6FC"
                  : "rgba(255,255,255,0.5)",
              border: "1px solid",
              borderColor: status === "HUMAN_RESOLVED"
                ? "rgba(38, 222, 129, 0.3)"
                : status === "AI_RESOLVED"
                  ? "rgba(94, 182, 252, 0.3)"
                  : "rgba(255,255,255,0.1)",
            }}
          />
        )}
      </Box>

      {!ticket && (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontSize: '0.9rem' }}>
            Select a ticket to view AI insights
          </Typography>
        </Box>
      )}

      {ticket && (
        <>
          {/* Suggested reply */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.5)",
                mb: 1,
                display: "block",
                textTransform: 'uppercase',
                fontSize: 10,
                fontWeight: 600
              }}
            >
              Suggested reply (editable)
            </Typography>

            <TextField
              multiline
              minRows={6}
              fullWidth
              variant="outlined"
              value={editableReply}
              onChange={(e) => setEditableReply(e.target.value)}
              // ✅ FIX: Disable editing if already resolved or closed
              disabled={status === "HUMAN_RESOLVED" || status === "CLOSED"}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                  fontSize: "0.85rem",
                  lineHeight: 1.6,
                  bgcolor: "rgba(255,255,255,0.02)",
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "#9b6cff" },
                  "&.Mui-focused fieldset": { borderColor: "#9b6cff" }
                },
              }}
            />

            <Button
              variant="contained"
              size="small"
              fullWidth
              sx={{ 
                mt: 1.5, 
                bgcolor: "rgba(155, 108, 255, 0.2)",
                color: "#cbb2ff",
                border: "1px solid rgba(155, 108, 255, 0.4)",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "rgba(155, 108, 255, 0.3)" }
              }}
              onClick={handleUseReply}
              // ✅ FIX: Also disable copy button when resolved/closed
              disabled={!editableReply.trim() || status === "HUMAN_RESOLVED" || status === "CLOSED"}
            >
              Copy to Draft Reply
            </Button>
          </Box>

          {/* Recommended tone */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1.5, display: "block", fontSize: 10 }}>
              RECOMMENDED RESPONSE TONE
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {showCalm && (
                <Chip label="Calm" size="small" sx={{ bgcolor: "rgba(76, 195, 255, 0.1)", color: "#4cc3ff", border: "1px solid rgba(76, 195, 255, 0.2)" }} />
              )}
              {showApologetic && (
                <Chip label="Apologetic" size="small" sx={{ bgcolor: "rgba(155, 108, 255, 0.1)", color: "#9b6cff", border: "1px solid rgba(155, 108, 255, 0.2)" }} />
              )}
              {/* ✅ FIX: Professional tone chip for HUMAN_RESOLVED */}
              {showProfessional && (
                <Chip label="Professional" size="small" sx={{ bgcolor: "rgba(38, 222, 129, 0.1)", color: "#26de81", border: "1px solid rgba(38, 222, 129, 0.2)" }} />
              )}
              {showClear && (
                <Chip label="Clear" size="small" sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#fff" }} />
              )}
              {/* ✅ FIX: Fallback if no tone matches (e.g. CLOSED) */}
              {!showCalm && !showApologetic && !showProfessional && !showClear && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
                  N/A
                </Typography>
              )}
            </Box>
          </Box>

          {/* Why AI escalated */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1, display: "block", fontSize: 10 }}>
              {/* ✅ FIX: Label changes based on status */}
              {status === "ESCALATED" ? "WHY AI ESCALATED" : "AI DECISION REASON"}
            </Typography>

            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontSize: '0.8rem' }}
              >
                {decisionReason}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3, borderColor: "rgba(255,255,255,0.08)" }} />

          {/* References */}
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mb: 1.5, display: "block", fontSize: 10 }}>
              KNOWLEDGE BASE CONTEXT
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontSize: '0.75rem',
                  color: '#8faac6',
                  borderColor: 'rgba(255,255,255,0.08)',
                  "&:hover": { bgcolor: 'rgba(255,255,255,0.03)', borderColor: '#5EB6FC' }
                }}
              >
                Chargeback Disputes Policy (Internal)
              </Button>

              <Button
                variant="outlined"
                size="small"
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  fontSize: '0.75rem',
                  color: '#8faac6',
                  borderColor: 'rgba(255,255,255,0.08)',
                  "&:hover": { bgcolor: 'rgba(255,255,255,0.03)', borderColor: '#5EB6FC' }
                }}
              >
                Billing Errors FAQ
              </Button>
            </Box>
          </Box>
        </>
      )}

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{
          mt: "auto",
          pt: 3,
          color: "rgba(255,255,255,0.3)",
          fontSize: 10,
          textAlign: "center",
        }}
      >
        AI suggestions help reduce response time.
      </Typography>
    </Box>
  );
}