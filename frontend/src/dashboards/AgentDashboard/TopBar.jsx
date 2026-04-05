import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";

export default function TopBar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClose = () => setAnchorEl(null);

  const handleViewProfile = () => {
    handleClose();
    navigate("/profile"); // ✅ FIX: was "/agent"
  };

  const handleLogout = () => {
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
        backgroundColor: "#0f172a",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
          GenAI Support
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Support Agent
          </Typography>

          <Avatar
            sx={{
              bgcolor: "#2563eb",
              cursor: "pointer",
              width: 36,
              height: 36,
              fontSize: 14,
            }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            AS
          </Avatar>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem disabled>
              <Typography variant="body2">Agent: A. Sharma</Typography>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleViewProfile}>View Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}