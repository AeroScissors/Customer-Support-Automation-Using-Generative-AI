import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Avatar,
  Box, Menu, MenuItem, Divider,
} from "@mui/material";

const ADMIN_TABS = [
  { label: "Overview",      path: "/admin/overview" },
  { label: "Analytics",     path: "/admin/analytics" },
  { label: "SLA",           path: "/admin/sla" },
  { label: "KnowledgeBase", path: "/admin/knowledge-base" },
  { label: "Agents",        path: "/admin/agents" },
];

// ✅ Get real initials from username stored in sessionStorage
function getInitials() {
  const role     = sessionStorage.getItem("role") || "";
  const token    = sessionStorage.getItem("access_token");

  if (!token) return role === "admin" ? "AD" : "AS";

  try {
    // Decode JWT payload (middle part)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const username = payload.sub || "";
    // Take first 2 chars, uppercase
    return username.slice(0, 2).toUpperCase() || (role === "admin" ? "AD" : "AS");
  } catch {
    return role === "admin" ? "AD" : "AS";
  }
}

function getDisplayName() {
  const token = sessionStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

export default function TopBar({ role = "agent" }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const initials    = getInitials();
  const displayName = getDisplayName();

  const handleClose   = () => setAnchorEl(null);
  const handleProfile = () => { handleClose(); navigate("/profile"); };
  const handleLogout  = () => {
    handleClose();
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: isAdmin ? "rgba(11,16,35,0.75)" : "#0f172a",
        backdropFilter: isAdmin ? "blur(18px)" : "none",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        ...(isAdmin && {
          "&::before": {
            content: '""', position: "absolute",
            top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            opacity: 0.4,
          },
        }),
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>

        {/* Brand */}
        <Typography fontWeight={600} fontSize={16} letterSpacing={0.5}>
          {isAdmin ? "GenAI Support – Admin" : "GenAI Support"}
        </Typography>

        {/* Admin nav tabs */}
        {isAdmin && (
          <Box sx={{ display: "flex", gap: 5, alignItems: "center" }}>
            {ADMIN_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              >
                {tab.label}
              </NavLink>
            ))}
          </Box>
        )}

        {/* Avatar + dropdown */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.2, cursor: "pointer" }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {isAdmin && (
            <Box sx={{ textAlign: "right" }}>
              {/* ✅ Real username */}
              <Typography fontSize={13}>{displayName || "Admin"}</Typography>
              <Typography fontSize={11} color="#8E96B8">Administrator</Typography>
            </Box>
          )}

          {!isAdmin && (
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Support Agent
            </Typography>
          )}

          {/* ✅ Real initials */}
          <Avatar sx={{
            bgcolor: isAdmin ? "#1f3b5c" : "#2563eb",
            width: 36, height: 36, fontSize: 13, fontWeight: 700,
          }}>
            {initials}
          </Avatar>
        </Box>

        {/* Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {/* ✅ Show real username in agent dropdown */}
          {!isAdmin && [
            <MenuItem key="name" disabled>
              <Typography variant="body2">{displayName || "Agent"}</Typography>
            </MenuItem>,
            <Divider key="div" />,
          ]}

          <MenuItem onClick={handleProfile}>
            {isAdmin ? "Profile" : "View Profile"}
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}