import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <StatusBar />
        <main className="content-area">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  );
}
