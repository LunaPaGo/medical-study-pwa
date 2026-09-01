import { NavLink } from 'react-router-dom';
import { LogOut, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useThemePreference } from '../../features/theme/useThemePreference';
import { primaryRoutes, secondaryRoutes } from './navigation';

interface SidebarProps {
  onCollapse: () => void;
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const { signOut, user } = useAuth();
  const { effectiveTheme } = useThemePreference();
  const symbolSrc =
    effectiveTheme === 'dark'
      ? '/branding/askleion-logo-vertical-dark.png'
      : '/branding/askleion-logo-vertical-light.png';

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="sidebar-heading">
        <div className="brand">
          <img className="brand-symbol" src={symbolSrc} alt="Símbolo de Askleion" />
          <div>
            <strong>Askleion</strong>
            <span>Biblioteca médica</span>
          </div>
        </div>
        <button
          className="sidebar-collapse-button"
          type="button"
          onClick={onCollapse}
          aria-label="Ocultar navegación principal"
          title="Ocultar navegación"
        >
          <PanelLeftClose size={20} aria-hidden="true" />
        </button>
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
