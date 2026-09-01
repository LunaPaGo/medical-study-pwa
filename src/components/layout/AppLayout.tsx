import { PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { EditingSessionRestorer } from '../../features/editingSessions/EditingSessionRestorer';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <EditingSessionRestorer />
      {!isSidebarCollapsed && <Sidebar onCollapse={() => setIsSidebarCollapsed(true)} />}
      <div className="app-main">
        {isSidebarCollapsed && (
          <button
            className="sidebar-reopen-button"
            type="button"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label="Abrir navegación principal"
            title="Abrir navegación"
          >
            <PanelLeftOpen size={20} aria-hidden="true" />
          </button>
        )}
        <StatusBar />
        <main className="content-area">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
