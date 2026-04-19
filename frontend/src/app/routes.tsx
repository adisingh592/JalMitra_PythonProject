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
import { MemberLayout } from './pages/member/MemberLayout';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MemberUsage } from './pages/member/MemberUsage';
import { MemberBilling } from './pages/member/MemberBilling';
import { MemberPayments } from './pages/member/MemberPayments';
import { MemberComplaints } from './pages/member/MemberComplaints';
import { MemberNotifications } from './pages/member/MemberNotifications';
import { MemberSchedule } from './pages/member/MemberSchedule';
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
      { path: 'monitoring', Component: AdminDashboard },
      { path: 'leakage', Component: AdminLeakage },
      { path: 'maintenance', Component: AdminMaintenance },
      { path: 'reports', Component: AdminReports },
      { path: 'users', Component: AdminDashboard },
      { path: 'inventory', Component: AdminDashboard },
      { path: 'alerts', Component: AdminAlerts },
      { path: 'analytics', Component: AdminReports },
      { path: 'settings', Component: AdminSettings },
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
      { path: 'schedule', Component: MemberSchedule },
    ],
  },
]);
