import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDataEntry } from './pages/admin/AdminDataEntry';
import { AdminLeakage } from './pages/admin/AdminLeakage';
import { AdminMaintenance } from './pages/admin/AdminMaintenance';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminAlerts } from './pages/admin/AdminAlerts';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminMonitoring } from './pages/admin/AdminMonitoring';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminPayments } from './pages/admin/AdminPayments';
import { MemberLayout } from './pages/member/MemberLayout';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MemberUsage } from './pages/member/MemberUsage';
import { MemberBilling } from './pages/member/MemberBilling';
import { MemberPayments } from './pages/member/MemberPayments';
import { MemberComplaints } from './pages/member/MemberComplaints';
import { MemberNotifications } from './pages/member/MemberNotifications';
import { MemberSchedule } from './pages/member/MemberSchedule';
import { MemberProfile } from './pages/member/MemberProfile';
import { MemberAnnouncements } from './pages/member/MemberAnnouncements';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'data-entry', Component: AdminDataEntry },
      { path: 'monitoring', Component: AdminMonitoring },
      { path: 'leakage', Component: AdminLeakage },
      { path: 'maintenance', Component: AdminMaintenance },
      { path: 'reports', Component: AdminReports },
      { path: 'users', Component: AdminUsers },
      { path: 'alerts', Component: AdminAlerts },
      { path: 'announcements', Component: AdminAnnouncements },
      { path: 'payments', Component: AdminPayments },
      { path: 'settings', Component: AdminSettings },
      { path: 'staff', Component: AdminStaff },
      { path: 'profile', Component: AdminProfile },
    ],
  },
  {
    path: '/member',
    element: (
      <ProtectedRoute allowedRoles={['member']}>
        <MemberLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: MemberDashboard },
      { path: 'dashboard', Component: MemberDashboard },
      { path: 'usage', Component: MemberUsage },
      { path: 'billing', Component: MemberBilling },
      { path: 'payments', Component: MemberPayments },
      { path: 'complaints', Component: MemberComplaints },
      { path: 'notifications', Component: MemberNotifications },
      { path: 'announcements', Component: MemberAnnouncements },
      { path: 'schedule', Component: MemberSchedule },
      { path: 'profile', Component: MemberProfile },
    ],
  },
]);
