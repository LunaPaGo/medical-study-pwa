import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../ui/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Comprobando sesión..." />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
