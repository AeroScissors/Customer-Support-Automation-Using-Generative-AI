import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Avatar, Chip, Divider, CircularProgress } from "@mui/material";
import { ArrowLeft, Shield, Clock, Ticket, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const BASE_URL = "https://aeroscissors-nebulacore.hf.space";

function authHeaders() {
  const token = sessionStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("role");

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch profile
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }

        // Fetch ticket metrics for agents
        if (role === "agent") {
          const mRes = await fetch(`${BASE_URL}/agent/ticket-metrics`, {
            headers: authHeaders(),
          });
          if (mRes.ok) setMetrics(await mRes.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [role]);

  const handleBack = () => {
    if (role === "admin") navigate("/admin");
    else navigate("/agent");
  };

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 20% 20%, #0d1b2e 0%, #050a14 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      p: 3,
      position: "relative",
    }}>

      {/* Back button */}
      <Box
        onClick={handleBack}
        sx={{
          position: "absolute", top: 24, left: 24,
          display: "flex", alignItems: "center", gap: 1,
          cursor: "pointer", color: "rgba(255,255,255,0.4)",
          fontSize: "0.85rem", fontWeight: 500,
          transition: "color 0.2s",
          "&:hover": { color: "#5EB6FC" },
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Box>

      {loading ? (
        <CircularProgress sx={{ color: "#5EB6FC" }} />
      ) : (
        <Box sx={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}>

          {/* Profile card */}
          <Box sx={{
            background: "linear-gradient(135deg, rgba(22,35,55,0.95), rgba(12,20,34,0.95))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            p: 4,
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>

            {/* Glow */}
            <Box sx={{
              position: "absolute", top: -60, left: "50%",
              transform: "translateX(-50%)",
              width: 200, height: 200,
              borderRadius: "50%",
              background: role === "admin"
                ? "radial-gradient(circle, rgba(155,108,255,0.15) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(94,182,252,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Avatar */}
            <Avatar sx={{
              width: 80, height: 80,
              fontSize: "1.8rem", fontWeight: 700,
              background: role === "admin"
                ? "linear-gradient(135deg, #9b6cff, #6c3fff)"
                : "linear-gradient(135deg, #5EB6FC, #2a8fd6)",
              boxShadow: role === "admin"
                ? "0 0 30px rgba(155,108,255,0.4)"
                : "0 0 30px rgba(94,182,252,0.4)",
              mb: 2,
            }}>
              {initials}
            </Avatar>

            <Typography sx={{
              fontSize: "1.4rem", fontWeight: 700,
              color: "#e6f1ff", mb: 0.5,
              letterSpacing: "-0.02em",
            }}>
              {profile?.username || "Unknown"}
            </Typography>

            <Chip
              icon={<Shield size={12} />}
              label={role === "admin" ? "Administrator" : "Support Agent"}
              size="small"
              sx={{
                bgcolor: role === "admin"
                  ? "rgba(155,108,255,0.15)"
                  : "rgba(94,182,252,0.15)",
                color: role === "admin" ? "#9b6cff" : "#5EB6FC",
                border: `1px solid ${role === "admin" ? "rgba(155,108,255,0.3)" : "rgba(94,182,252,0.3)"}`,
                fontWeight: 600, fontSize: "0.7rem",
                mt: 0.5,
              }}
            />

            <Divider sx={{ width: "100%", borderColor: "rgba(255,255,255,0.06)", my: 3 }} />

            {/* Info rows */}
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>

              <InfoRow
                icon={<Clock size={14} />}
                label="Member Since"
                value={formatDate(profile?.created_at)}
              />

              <InfoRow
                icon={<Clock size={14} />}
                label="Last Active"
                value={formatDateTime(profile?.last_seen)}
              />

              <InfoRow
                icon={<Shield size={14} />}
                label="User ID"
                value={profile?.user_id || "N/A"}
                mono
              />

            </Box>
          </Box>

          {/* Ticket stats — agents only */}
          {role === "agent" && metrics && (
            <Box sx={{
              background: "linear-gradient(135deg, rgba(22,35,55,0.95), rgba(12,20,34,0.95))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              p: 3,
              backdropFilter: "blur(12px)",
            }}>
              <Typography sx={{
                fontSize: "0.7rem", fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: 1.5, textTransform: "uppercase",
                mb: 2.5,
              }}>
                Ticket Statistics
              </Typography>

              <Box sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
              }}>
                <StatCard
                  icon={<AlertTriangle size={16} />}
                  label="Open Escalations"
                  value={metrics.open ?? 0}
                  color="#ff9f43"
                />
                <StatCard
                  icon={<Ticket size={16} />}
                  label="Total Escalated"
                  value={metrics.total_escalated ?? 0}
                  color="#5EB6FC"
                />
                <StatCard
                  icon={<CheckCircle size={16} />}
                  label="Resolved"
                  value={metrics.resolved ?? 0}
                  color="#26de81"
                />
                <StatCard
                  icon={<XCircle size={16} />}
                  label="Closed"
                  value={metrics.closed ?? 0}
                  color="rgba(255,255,255,0.3)"
                />
              </Box>
            </Box>
          )}

        </Box>
      )}
    </Box>
  );
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <Box sx={{
      display: "flex", justifyContent: "space-between",
      alignItems: "center", px: 0,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.35)" }}>
        {icon}
        <Typography sx={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{
        fontSize: "0.82rem", fontWeight: 600,
        color: "#c8ddf0",
        fontFamily: mono ? "monospace" : "inherit",
        fontSize: mono ? "0.72rem" : "0.82rem",
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <Box sx={{
      p: 2, borderRadius: "14px",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column", gap: 1,
    }}>
      <Box sx={{ color, display: "flex", alignItems: "center", gap: 0.5 }}>
        {icon}
        <Typography sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "1.8rem", fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}
