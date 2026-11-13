'use client';

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isCollapsed={sidebarCollapsed && !isMobile}
        onToggleCollapse={toggleCollapse}
      />

      {/* Header */}
      <Header onMenuClick={toggleSidebar} isMobile={isMobile} />

      {/* Contenido principal */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          isMobile ? 'lg:pl-64' : sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
        role="main"
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}