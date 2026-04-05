import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/api";

export default function CustomerChat() {
  const [messages, setMessages] = useState([
    { sender: "ai", content: "Hello 👋 How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { sender: "customer", content: text }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(text);

      const aiReply =
        data.response ||
        (data.decision === "ESCALATE_TO_HUMAN"
          ? "Your request has been forwarded to a support agent."
          : "I'm unable to answer this right now. A support agent will assist you shortly.");

      const ticketInfo = data.ticket_id
        ? `\nTICKET:${data.ticket_id}|STATUS:${data.decision}`
        : "";

      setMessages((prev) => [
        ...prev,
        { sender: "ai", content: aiReply + ticketInfo },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-main, #080d1a)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
    }}>
      {/* AI Online indicator */}
      <div style={{
        position: "fixed", top: 16, right: 20,
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "rgba(255,255,255,0.5)",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#26de81",
          boxShadow: "0 0 8px #26de81",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        AI Online
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Chat container */}
      <div style={{
        width: "100%",
        maxWidth: 720,
        background: "linear-gradient(145deg, rgba(16,26,50,0.9), rgba(8,14,28,0.95))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 520,
        maxHeight: "80vh",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
          fontSize: 11, letterSpacing: 2,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
        }}>
          Secure Conversation
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "24px",
          display: "flex", flexDirection: "column", gap: 20,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.06) transparent",
        }}>
          {messages.map((msg, idx) => {
            const isAI = msg.sender === "ai";
            const parts = msg.content.split("\n");
            const mainText = parts[0];
            const ticketLine = parts.find(p => p.startsWith("TICKET:"));

            return (
              <div key={idx} style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isAI ? "flex-start" : "flex-end",
                gap: 4,
              }}>
                {isAI && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", marginLeft: 4 }}>
                    AI Assistant
                  </span>
                )}

                <div style={{
                  maxWidth: "75%",
                  padding: "12px 18px",
                  borderRadius: isAI ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                  background: isAI
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, rgba(94,182,252,0.2), rgba(76,195,255,0.1))",
                  border: isAI
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(94,182,252,0.2)",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#e6f1ff",
                }}>
                  {mainText}
                </div>

                {/* Ticket info pill */}
                {ticketLine && (
                  <div style={{
                    fontSize: 10, color: "rgba(255,255,255,0.25)",
                    marginLeft: 4, letterSpacing: 0.5,
                  }}>
                    {ticketLine.replace("TICKET:", "").replace("|STATUS:", " · ")}
                  </div>
                )}
              </div>
            );
          })}

          {/* ✅ Typing indicator */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", marginLeft: 4 }}>
                AI Assistant
              </span>
              <div className="ai-typing-indicator">
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 12, alignItems: "center",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "12px 16px",
              color: "#e6f1ff", fontSize: 14, outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(76,195,255,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim()
                ? "rgba(76,195,255,0.2)"
                : "linear-gradient(135deg, #5EB6FC, #4cc9f0)",
              border: "none", borderRadius: 12,
              padding: "12px 24px",
              color: loading || !input.trim() ? "rgba(255,255,255,0.3)" : "#000",
              fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}