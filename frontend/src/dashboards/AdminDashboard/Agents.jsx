import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  CircularProgress,
  InputAdornment,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from "@mui/material";
import {
  Wifi,
  FiberManualRecord,
  Bedtime,
  ViewHeadline,
  PersonAddAlt1,
  LockOutlined,
  Group,
  Close
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getAdminAgents } from "../../services/api";

const BASE_URL = "http://localhost:8000";

export default function AdminAgents() {
  const [metrics, setMetrics] = useState({
    online: 0,
    active: 0,
    idle: 0,
    avgTickets: 0
  });

  const [agents, setAgents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Global Metrics Polling (Background)
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. 🔥 NEW: Live Agent Status Polling (Only when drawer is open)
  useEffect(() => {
    if (!drawerOpen) return;

    loadAgents(); // Initial load when drawer opens

    const interval = setInterval(() => {
      loadAgents();
    }, 600000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [drawerOpen]);

  // ✅ Fixed Metrics: Count based on status
  const loadMetrics = async () => {
  try {
    const data = await getAdminAgents();

    let online = 0;
    let active = 0;
    let idle = 0;

    data.forEach((a) => {
      if (a.status === "active") {
        active++;
        online++;
      } else if (a.status === "idle") {
        idle++;
        online++;
      }
    });

    setMetrics({
      online,
      active,
      idle,
      avgTickets: 0
    });

  } catch (err) {
    console.error("Failed to fetch workforce metrics", err);
  }
};

  const loadAgents = async () => {
    try {
      const data = await getAdminAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to fetch agents", err);
    }
  };

  const handleCreateAgent = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("access_token");

      const res = await fetch(`${BASE_URL}/agent/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create agent");
      }

      setSuccess(`Agent account '${username}' created successfully`);
      setUsername("");
      setPassword("");
      loadMetrics(); // Refresh metrics after creation
      if (drawerOpen) loadAgents(); // Refresh list if drawer is open
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refactored: Just open drawer, useEffect handles loading
  const openDrawer = () => {
    setDrawerOpen(true);
  };

  return (
    <Box pt={2}>

      {/* ===================== */}
      {/* 1️⃣ Polished Metric Cards */}
      {/* ===================== */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)"
          },
          gap: "24px",
          mb: 6
        }}
      >
        {[
          {
            label: "Agents Online",
            val: metrics.online,
            icon: <Wifi sx={{ color: "#5EB6FC", fontSize: 22 }} />,
            glow: "rgba(94,182,252,0.35)"
          },
          {
            label: "Agents Active",
            val: metrics.active,
            icon: <FiberManualRecord sx={{ color: "#2ecc71", fontSize: 16 }} />,
            glow: "rgba(46,204,113,0.35)"
          },
          {
            label: "Agents Idle",
            val: metrics.idle,
            icon: <Bedtime sx={{ color: "#D6AA99", fontSize: 20 }} />,
            glow: "rgba(214,170,153,0.35)"
          },
          {
            label: "Avg Tickets",
            val: metrics.avgTickets,
            icon: <ViewHeadline sx={{ color: "#5EB6FC", fontSize: 20 }} />,
            glow: "rgba(94,182,252,0.35)"
          }
        ].map((card, idx) => (
          <Box
            key={idx}
            sx={{
              height: "143px",
              px: 3,
              py: 2.5,
              borderRadius: "16px",
              background: "linear-gradient(180deg, #0E1628, #0B1222)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Top Row */}
            <Box display="flex" alignItems="center" gap={1.5}>
              {card.icon}
              <Typography
                fontSize={14}
                fontWeight={500}
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                {card.label}
              </Typography>
            </Box>

            {/* Big Metric */}
            <Typography
              sx={{
                fontSize: "38px",
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1
              }}
            >
              {card.val}
            </Typography>

            {/* Bottom Glow */}
            <Box
              sx={{
                position: "absolute",
                bottom: -25,
                left: "20%",
                width: "60%",
                height: "70px",
                background: `radial-gradient(circle, ${card.glow}, transparent 70%)`,
                filter: "blur(45px)",
                opacity: 0.7
              }}
            />
          </Box>
        ))}
      </Box>

      {/* ===================== */}
      {/* 2️⃣ Create Agent Section */}
      {/* ===================== */}

      <Paper
        elevation={0}
        sx={{
          p: 4,
          background: "linear-gradient(180deg, #0E1628, #0B1222)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <PersonAddAlt1 sx={{ color: "#2ecc71" }} />
            <Typography fontSize={18} fontWeight={600} sx={{ color: "#fff" }}>
              Create Agent Account
            </Typography>
        </Box>

        <Typography fontSize={13} color="rgba(255,255,255,0.5)" mb={4}>
          Issue credentials for a new support agent. New agents will be able to handle escalated queries in the Agent Dashboard.
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            variant="filled"
            sx={{ mb: 3, borderRadius: "12px", bgcolor: "rgba(211, 47, 47, 0.8)" }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            variant="filled"
            sx={{ mb: 3, borderRadius: "12px", bgcolor: "rgba(46, 204, 113, 0.8)" }}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Username"
              placeholder="e.g. agent_smith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAddAlt1 sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  bgcolor: "rgba(0,0,0,0.2)",
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" }
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Temporary Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  bgcolor: "rgba(0,0,0,0.2)",
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" }
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              disabled={loading}
              onClick={handleCreateAgent}
              sx={{
                height: "56px",
                bgcolor: "#2ecc71",
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "15px",
                "&:hover": { bgcolor: "#27ae60" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)" }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Create Agent Account"}
            </Button>
          </Grid>
        </Grid>

        {/* 🔹 VIEW ALL AGENTS BUTTON */}
        <Box mt={4} pt={3} borderTop="1px solid rgba(255,255,255,0.06)" display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<Group />}
            onClick={openDrawer}
            sx={{
              bgcolor: "rgba(94,182,252,0.1)",
              color: "#5EB6FC",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 600,
              border: "1px solid rgba(94,182,252,0.3)",
              px: 3,
              "&:hover": { bgcolor: "rgba(94,182,252,0.2)" }
            }}
          >
            View All Agents
          </Button>
        </Box>

      </Paper>

      {/* ================= DRAWER (RIGHT SIDE PANEL) ================= */}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 450,
            bgcolor: "#0B1222",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            p: 4
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" fontWeight={600} color="#fff">
            All Agents
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ bgcolor: "rgba(255,255,255,0.05)" }}>
            <Close sx={{ color: "#fff" }} />
          </IconButton>
        </Box>

        <TableContainer component={Paper} sx={{ bgcolor: "transparent", boxShadow: "none" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "#8faac6", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Username</TableCell>
                <TableCell sx={{ color: "#8faac6", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.user_id}>
                  <TableCell sx={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.05)", py: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box 
                            sx={{ 
                                width: 32, height: 32, 
                                borderRadius: "50%", 
                                bgcolor: "rgba(94,182,252,0.2)", 
                                color: "#5EB6FC",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 700, fontSize: 14
                            }}
                        >
                            {agent.username.charAt(0).toUpperCase()}
                        </Box>
                        {agent.username}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Chip
                      label={agent.status}
                      size="small"
                      sx={{
                        bgcolor: agent.status === "online" ? "rgba(46, 204, 113, 0.2)" : 
                                 agent.status === "idle" ? "rgba(241, 196, 15, 0.2)" : "rgba(255,255,255,0.1)",
                        color: agent.status === "online" ? "#2ecc71" : 
                               agent.status === "idle" ? "#f1c40f" : "#888",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        fontSize: 11
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Drawer>

    </Box>
  );
}