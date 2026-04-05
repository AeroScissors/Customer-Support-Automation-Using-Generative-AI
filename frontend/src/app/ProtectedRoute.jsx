import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  const token = sessionStorage.getItem("access_token");
  const userRole = sessionStorage.getItem("role");

  // Not logged in
  if (!token || !userRole) {
    return <Navigate to="/" replace />;
  }

  // Role mismatch
  if (role && userRole !== role) {
    // Redirect based on actual role
    return (
      <Navigate
        to={userRole === "admin" ? "/admin" : "/agent"}
        replace
      />
    );
  }

  return children;
}
