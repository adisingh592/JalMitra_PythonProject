import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'member'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { role } = useAuth();

  // If user is not logged in, redirect to login page
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // If user does not have required role, redirect to their respective dashboard
  if (!allowedRoles.includes(role)) {
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/member/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
