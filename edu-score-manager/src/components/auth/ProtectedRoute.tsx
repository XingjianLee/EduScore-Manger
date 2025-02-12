import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const teacherId = localStorage.getItem('teacherId');

  if (!teacherId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}; 