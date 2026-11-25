import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { homeForRole } from '../../utils/constants';
import { useToast } from './Toast.jsx';
import { PageSpinner } from './Spinner.jsx';

/**
 * Guards a route tree. Unauthenticated users go to /login (target remembered in state);
 * authenticated users with the wrong role go to their own dashboard with a toast.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const warned = useRef(false);

  const wrongRole = !!user && allowedRoles && !allowedRoles.includes(user.role);

  useEffect(() => {
    if (wrongRole && !warned.current) {
      warned.current = true;
      toast.error('You are not authorized to view that page.');
    }
  }, [wrongRole, toast]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-base">
        <PageSpinner label="Restoring your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (wrongRole) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
