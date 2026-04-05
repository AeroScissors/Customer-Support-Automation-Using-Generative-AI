import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import TopBar from "../../components/ui/TopBar"; // ✅ shared

export default function AdminDashboard() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: `radial-gradient(circle at 50% 0%, #1A2345 0%, #0C122A 60%, #070B1A 100%)`,
      }}
    >
      <TopBar role="admin" />

      <Box
        sx={{
          flex: 1,
          paddingTop: 1.5,
          paddingX: 3,
          paddingBottom: 1,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}