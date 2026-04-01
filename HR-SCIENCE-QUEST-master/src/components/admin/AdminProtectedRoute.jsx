import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("admin_token");
  const refreshToken = localStorage.getItem("admin_refresh_token");

  if (!token && !refreshToken) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
