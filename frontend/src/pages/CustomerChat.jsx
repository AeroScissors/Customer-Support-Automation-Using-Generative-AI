import { Box, Typography, TextField, Button } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

export default function CustomerChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };

    // 1. Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // 2. Call API
      const data = await sendChatMessage(input);

      // 3. Add AI response with Ticket Info
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: data.message, // Updated from data.response
          ticket_id: data.ticket_id, // Capture Ticket ID
          status: data.status        // Capture Status
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 50% 30%, rgba(76,195,255,0.04), transparent 60%),
          #0b1220
        `,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(11,18,32,0.7)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Typography 
          sx={{ 
            fontWeight: 600, 
            fontSize: "16px", 
            letterSpacing: "0.5px", 
            color: "#e6edf7" 
          }}
        >
          Gen<span style={{ color: "#3ba6d9" }}>AI</span> Support
        </Typography>

        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: 20,
            fontSize: 12,
            background: "rgba(255, 255, 255, 0.05)", 
            color: "#94a3b8", 
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          ● AI Online
        </Box>
      </Box>

      {/* Main Chat Layout */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >
        {/* Chat Card */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 880,
            height: "78vh",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.08)",
            background: `
              linear-gradient(
                145deg,
                rgba(255,255,255,0.06),
                rgba(255,255,255,0.02)
              )
            `,
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.45),
              inset 0 1px 0 rgba(255,255,255,0.04)
            `,
          }}
        >
          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              pt: 3, 
              px: 4, 
              pb: 4,
              gap: 3,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Intro Label */}
            <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.04)", pb: 2, mb: 0 }}>
               <Typography
                sx={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  textAlign: "center"
                }}
              >
                Secure Conversation
              </Typography>
            </Box>

            {/* Dynamic Messages */}
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {/* AI Label (Only show for assistant messages) */}
                {msg.role === "assistant" && (
                   <Typography
                    sx={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.4)",
                      mb: 0.5,
                      ml: 0.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}
                  >
                    AI Assistant
                  </Typography>
                )}

                <Box
                  sx={{
                    background:
                      msg.role === "user"
                        ? "#3ba6d9" // Corporate Blue
                        : "rgba(255,255,255,0.06)",
                    px: 2,
                    py: 1.5,
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 4px 12px"
                        : "12px 12px 12px 4px",
                    color: msg.role === "user" ? "#0b1220" : "#e6edf7",
                    fontWeight: msg.role === "user" ? 500 : 400,
                    boxShadow: msg.role === "user" ? "0 4px 12px rgba(59, 166, 217, 0.2)" : "none"
                  }}
                >
                  {/* Message Content */}
                  {msg.content}

                  {/* Ticket Info Display (New) */}
                  {msg.ticket_id && (
                    <Box
                      sx={{
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#3ba6d9" }}>TICKET:</span> {msg.ticket_id}
                      <span style={{ margin: "0 4px" }}>|</span>
                      <span style={{ fontWeight: 600, color: "#e6edf7" }}>STATUS:</span> {msg.status}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <Box
                sx={{
                  alignSelf: "flex-start",
                  maxWidth: "70%",
                }}
              >
                 <Typography
                    sx={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", mb: 0.5, ml: 0.5, textTransform: "uppercase" }}
                  >
                    AI Assistant
                  </Typography>
                <Box
                  sx={{
                    background: "rgba(255,255,255,0.06)",
                    px: 2,
                    py: 1.5,
                    borderRadius: "12px 12px 12px 4px",
                    color: "rgba(230,237,247,0.7)",
                    fontStyle: "italic",
                    fontSize: "0.9rem"
                  }}
                >
                  Typing...
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Box
              sx={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 999,
                padding: "4px 4px 4px 16px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <TextField
                fullWidth
                placeholder="Type your message..."
                variant="standard"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleSend();
                }}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    color: "#e6edf7",
                    fontSize: "0.95rem",
                  },
                }}
              />

              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading}
                sx={{
                  borderRadius: 999,
                  background: "#3ba6d9",
                  color: "#0b1220",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  minWidth: "80px",
                  "&:hover": {
                    background: "#3399cc",
                    boxShadow: "none",
                  },
                  "&:disabled": {
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)"
                  }
                }}
              >
                {loading ? "..." : "Send"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}