import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../ui/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profileStatus, profileError, isLoading, bootStep } = useAuth();

  // Connectivity revalidation must not unmount an already approved session.
  // Keeping the protected tree mounted preserves active, unsaved editor state.
  if (isLoading && (!session || profileStatus !== 'approved')) {
    return <LoadingScreen message={bootStep || 'Comprobando sesión...'} />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (profileError) {
    return <Navigate to="/auth" replace />;
  }

  if (profileStatus !== 'approved') {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
