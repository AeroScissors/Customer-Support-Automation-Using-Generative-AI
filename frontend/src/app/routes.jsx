import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import AgentDashboard from "../dashboards/AgentDashboard/AgentDashboard";
import AdminDashboard from "../dashboards/AdminDashboard/AdminDashboard";
import CustomerChat from "../pages/CustomerChat";
import ProfilePage from "../pages/ProfilePage";

import AdminOverview from "../dashboards/AdminDashboard/Overview";
import AdminAnalytics from "../dashboards/AdminDashboard/Analytics";
import AdminSLA from "../dashboards/AdminDashboard/SLA";
import AdminKnowledgeBase from "../dashboards/AdminDashboard/KnowledgeBase";
import AdminAgents from "../dashboards/AdminDashboard/Agents";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ✅ Both / and /login show the login page */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      <Route path="/chat" element={<CustomerChat />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agent"
        element={
          <ProtectedRoute role="agent">
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

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

      {/* Catch-all → redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}