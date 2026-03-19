import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Spinner } from './ui';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
