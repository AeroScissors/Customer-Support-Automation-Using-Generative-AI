import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";

// Dashboards
import AgentDashboard from "../dashboards/AgentDashboard/AgentDashboard";
import AdminDashboard from "../dashboards/AdminDashboard/AdminDashboard";
import CustomerChat from "../pages/CustomerChat";

// Admin Tabs
import AdminOverview from "../dashboards/AdminDashboard/Overview";
import AdminAnalytics from "../dashboards/AdminDashboard/Analytics";
import AdminSLA from "../dashboards/AdminDashboard/SLA";
import AdminKnowledgeBase from "../dashboards/AdminDashboard/KnowledgeBase";
import AdminAgents from "../dashboards/AdminDashboard/Agents";

// Route Guard
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===================== */}
      {/* Login (PUBLIC) */}
      {/* ===================== */}
      <Route path="/" element={<Login />} />

      {/* ===================== */}
      {/* Customer Chat (PUBLIC) */}
      {/* ===================== */}
      <Route path="/chat" element={<CustomerChat />} />

      {/* ===================== */}
      {/* Agent (PROTECTED) */}
      {/* ===================== */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute role="agent">
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

      {/* ===================== */}
      {/* Admin (PROTECTED) */}
      {/* ===================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="sla" element={<AdminSLA />} />
        <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
        <Route path="agents" element={<AdminAgents />} />
      </Route>

      {/* ===================== */}
      {/* Fallback */}
      {/* ===================== */}
      <Route
        path="*"
        element={<div style={{ padding: 20 }}>404 — Not Found</div>}
      />
    </Routes>
  );
}
