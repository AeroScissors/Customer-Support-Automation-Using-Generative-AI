import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";

const tabs = [
  { label: "Overview", path: "/admin/overview" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "SLA", path: "/admin/sla" },
  { label: "KnowledgeBase", path: "/admin/knowledge-base" },
  { label: "Agents", path: "/admin/agents" },
];

export default function AdminDashboard() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // ✅ prevents global page scroll
        background: `
          radial-gradient(
            circle at 50% 0%,
            #1A2345 0%,
            #0C122A 60%,
            #070B1A 100%
          )
        `,
      }}
    >
      {/* ===================== */}
      {/* Top Bar */}
      {/* ===================== */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          position: "relative",
          background: "rgba(11, 16, 35, 0.75)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          overflow: "hidden",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            opacity: 0.4,
          },

          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-30%",
            width: "30%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            animation: "navbarShimmer 6s linear infinite",
            pointerEvents: "none",
          },
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Left */}
          <Typography fontWeight={600}>
            GenAI Support – Admin
          </Typography>

          {/* Center */}
          <Box
            sx={{
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </Box>

          {/* Right */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              cursor: "pointer",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#1f3b5c",
                width: 36,
                height: 36,
                fontSize: 14,
              }}
            >
              AD
            </Avatar>

            <Box>
              <Typography fontSize={13}>Admin</Typography>
              <Typography fontSize={11} color="#8E96B8">
                Administrator
              </Typography>
            </Box>
          </Box>

          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem disabled>Profile</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ===================== */}
      {/* Page Content */}
      {/* ===================== */}
      <Box
        sx={{
          flex: 1,
          paddingTop: 1.5,
          paddingX: 3,
          paddingBottom: 1,
          overflowY: "auto", // ✅ only this section scrolls
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
