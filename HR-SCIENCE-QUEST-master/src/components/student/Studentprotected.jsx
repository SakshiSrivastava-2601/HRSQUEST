import { Navigate } from "react-router-dom";

const StudentProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("student_refresh_token");

  if (!token && !refreshToken) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
