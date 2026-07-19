import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { bottomRoutes } from './navigation';

export function BottomNavigation() {
  const navRef = useRef<HTMLElement | null>(null);
  const [overflowState, setOverflowState] = useState({ hasLeft: false, hasRight: false });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateOverflowState = () => {
      const maxScrollLeft = nav.scrollWidth - nav.clientWidth;
      setOverflowState({
        hasLeft: nav.scrollLeft > 4,
        hasRight: nav.scrollLeft < maxScrollLeft - 4
      });
    };

    const activeLink = nav.querySelector<HTMLAnchorElement>('.bottom-nav-link.active');
    activeLink?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    updateOverflowState();

    nav.addEventListener('scroll', updateOverflowState, { passive: true });
    window.addEventListener('resize', updateOverflowState);
    return () => {
      nav.removeEventListener('scroll', updateOverflowState);
      window.removeEventListener('resize', updateOverflowState);
    };
  });

  return (
    <nav
      ref={navRef}
      className={`bottom-nav ${overflowState.hasLeft ? 'has-left-overflow' : ''} ${overflowState.hasRight ? 'has-right-overflow' : ''}`}
      aria-label="Navegación inferior"
    >
      {bottomRoutes.map((route) => (
        <NavLink key={route.path} to={route.path} className="bottom-nav-link">
          <route.icon size={21} aria-hidden="true" />
          <span>{route.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
