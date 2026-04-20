import { Outlet } from 'react-router';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { LayoutDashboard, Droplets, FileText, IndianRupee, MessageSquare, Bell, Calendar, Megaphone } from 'lucide-react';

const sidebarItems = [
  { path: '/member/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/member/usage', label: 'Usage', icon: <Droplets size={20} /> },
  { path: '/member/billing', label: 'Billing', icon: <FileText size={20} /> },
  { path: '/member/payments', label: 'Payments', icon: <IndianRupee size={20} /> },
  { path: '/member/complaints', label: 'Complaints', icon: <MessageSquare size={20} /> },
  { path: '/member/notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { path: '/member/announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
  { path: '/member/schedule', label: 'Schedule', icon: <Calendar size={20} /> },
];

export function MemberLayout() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar showUserMenu userType="member" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar items={sidebarItems} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
