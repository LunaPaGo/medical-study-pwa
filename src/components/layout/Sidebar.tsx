import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useThemePreference } from '../../features/theme/useThemePreference';
import { primaryRoutes, secondaryRoutes } from './navigation';

export function Sidebar() {
  const { signOut, user } = useAuth();
  const { effectiveTheme } = useThemePreference();
  const symbolSrc =
    effectiveTheme === 'dark' ? '/branding/askleion-symbol-light.svg' : '/branding/askleion-symbol.svg';

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="brand">
        <img className="brand-symbol" src={symbolSrc} alt="Símbolo de Askleion" />
        <div>
          <strong>Askleion</strong>
          <span>Biblioteca médica</span>
        </div>
      </div>

      <nav className="nav-list">
        {primaryRoutes.map((route) => (
          <NavLink key={route.path} to={route.path} className="nav-link">
            <route.icon size={20} aria-hidden="true" />
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>

      <nav className="nav-list nav-list-secondary">
        {secondaryRoutes.slice(0, 2).map((route) => (
          <NavLink key={route.path} to={route.path} className="nav-link">
            <route.icon size={20} aria-hidden="true" />
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="user-email">{user?.email}</span>
        <button className="ghost-button" type="button" onClick={signOut}>
          <LogOut size={18} aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
