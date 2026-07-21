import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getLatestEditingSessionForUser } from './editingSessionRepository';

export function EditingSessionRestorer() {
  const { user, isReadOnly } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || checkedRef.current || isReadOnly) return;
    checkedRef.current = true;

    getLatestEditingSessionForUser(user.id)
      .then((session) => {
        if (!session) return;
        const currentRoute = `${location.pathname}${location.search}`;
        if (session.route && session.route !== currentRoute) {
          navigate(session.route, { replace: true });
        }
      })
      .catch(() => undefined);
  }, [isReadOnly, location.pathname, location.search, navigate, user?.id]);

  return null;
}
