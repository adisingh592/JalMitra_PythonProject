import { Outlet } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { LayoutDashboard, FileInput, Activity, Droplets, Wrench, BarChart3, Users, User, Bell, Megaphone, Settings } from 'lucide-react';

const sidebarItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/admin/data-entry', label: 'Data Entry', icon: <FileInput size={20} /> },
  { path: '/admin/monitoring', label: 'Monitoring', icon: <Activity size={20} /> },
  { path: '/admin/leakage', label: 'Leakage', icon: <Droplets size={20} /> },
  { path: '/admin/maintenance', label: 'Maintenance', icon: <Wrench size={20} /> },
  { path: '/admin/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={20} /> },
  { path: '/admin/staff', label: 'Staff Directory', icon: <User size={20} /> },
  { path: '/admin/alerts', label: 'Alerts', icon: <Bell size={20} /> },
  { path: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function AdminLayout() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar showUserMenu userType="admin" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
