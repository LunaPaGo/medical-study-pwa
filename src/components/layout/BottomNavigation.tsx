import { NavLink } from 'react-router-dom';
import { bottomRoutes } from './navigation';

export function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Navegación inferior">
      {bottomRoutes.map((route) => (
        <NavLink key={route.path} to={route.path} className="bottom-nav-link">
          <route.icon size={21} aria-hidden="true" />
          <span>{route.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
