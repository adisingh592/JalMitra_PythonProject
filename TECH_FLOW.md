# Jal Mitra Technical Flow

This document explains the technical flow of each panel and section in Jal Mitra, including UI flow, backend API usage, and data behavior.

---

## 1) System Overview

- Frontend: React + TypeScript (Vite)
- Backend: FastAPI + SQLAlchemy
- Database: MySQL (primary), SQLite (fallback)
- Auth model: token pattern (`mock-jwt-admin-*`, `mock-jwt-member-*`)
- Routing model: role-protected route groups under `/admin/*` and `/member/*`

---

## 2) Authentication and Session Flow

### Login
- UI: `frontend/src/app/pages/LoginPage.tsx`
- API: `POST /api/login`
- Request: `{ username, password, role }`
- Response: `{ role, user_id, full_name, token }`
- Client stores:
  - `userRole`
  - `userId`
  - `authToken`
  - `userFullName`

### Route Protection
- Component: `frontend/src/app/components/ProtectedRoute.tsx`
- Role gating:
  - Admin routes: `/admin/*`
  - Member routes: `/member/*`

---

## 3) Shared Top Navbar Flow

Component: `frontend/src/app/components/Navbar.tsx`

### Notification Icon
- Click behavior:
  - Admin -> `/admin/alerts`
  - Member -> `/member/notifications`
- Dynamic badge behavior:
  - Admin badge count = complaints where status is not `resolved`
    - API: `GET /api/admin/complaints`
  - Member badge count = unread notifications (`read = false`)
    - API: `GET /api/member/notifications`

### Profile Icon
- Click behavior:
  - Admin -> `/admin/profile`
  - Member -> `/member/profile`

### Theme Toggle
- Local UI state switch via theme context

### Logout
- Clears auth context and local storage
- Redirects to `/login`

---

## 4) Admin Panel Technical Flow

Base layout: `frontend/src/app/pages/admin/AdminLayout.tsx`

### 4.1 Dashboard (`/admin/dashboard`)
- UI: `AdminDashboard`
- APIs:
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/leakage`
  - `GET /api/admin/members?active_only=false`
  - `GET /api/admin/staff`
- Purpose:
  - KPI cards, leakage trend, ops overview

### 4.2 Data Entry (`/admin/data-entry`)
- UI: `AdminDataEntry`
- APIs:
  - `GET /api/cities`
  - `GET /api/water/entry-meta`
  - `GET /api/water/entries?date_from=...&date_to=...`
  - `POST /api/cities`
  - `POST /api/water/entries`
  - `POST /api/water/reset`
- Flow:
  - Admin adds city (if missing)
  - Submits or updates daily water supply/consumption
  - Can reset historical water entries if needed

### 4.3 Monitoring (`/admin/monitoring`)
- UI: `AdminMonitoring`
- APIs:
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/leakage`
- Flow:
  - Visual health tracking and area-level performance

### 4.4 Leakage (`/admin/leakage`)
- UI: `AdminLeakage`
- API:
  - `GET /api/analytics/leakage`
- Flow:
  - City-wise leakage stats and severity mapping

### 4.5 Maintenance (`/admin/maintenance`)
- UI: `AdminMaintenance`
- APIs:
  - `GET /api/admin/complaints`
  - `GET /api/admin/workers`
  - `POST /api/admin/workers`
  - `PATCH /api/admin/complaints/{complaint_id}`
- Flow:
  - View all complaints
  - Manage worker registry
  - Assign and resolve maintenance jobs

### 4.6 Reports (`/admin/reports`)
- UI: `AdminReports`
- APIs:
  - `GET /api/analytics/dashboard`
  - `GET /api/analytics/leakage`
- Flow:
  - Chart-driven reporting on supply, consumption, and loss percentages

### 4.7 Users & Billing (`/admin/users`)
- UI: `AdminUsers`
- APIs:
  - `GET /api/admin/members?active_only=false`
  - `GET /api/admin/members/{member_id}`
  - `PATCH /api/admin/members/{member_id}`
  - `PATCH /api/admin/bills/{bill_id}`
  - `POST /api/admin/members/{member_id}/generate-bill`
  - `GET /api/admin/settings/billing-tariff`
- Flow:
  - Open member profile dialog
  - Edit member details
  - Toggle bill paid/unpaid
  - Generate new bill with tariff preview

### 4.8 Staff Directory (`/admin/staff`)
- UI: `AdminStaff`
- API:
  - `GET /api/admin/staff`
- Flow:
  - Read-only staff listing and profile metadata view

### 4.9 Alerts & Complaints (`/admin/alerts`)
- UI: `AdminAlerts`
- APIs:
  - `GET /api/admin/complaints`
  - `PATCH /api/admin/complaints/{complaint_id}`
  - `GET /api/admin/workers`
  - `GET /api/admin/members`
  - `POST /api/admin/alerts`
  - `GET /api/admin/complaints/{complaint_id}/updates`
  - `POST /api/admin/complaints/{complaint_id}/updates`
- Flow:
  - Send targeted alert to a selected member
  - Assign worker to complaint
  - Add progress update (with optional percent)
  - Open complaint timeline
  - Update status to resolved -> member gets completion notification

### 4.10 Announcements (`/admin/announcements`)
- UI: `AdminAnnouncements`
- APIs:
  - `POST /api/admin/announcements`
  - `GET /api/announcements`
- Flow:
  - Admin publishes announcement once
  - Announcement becomes visible to both admin and member panels

### 4.11 Settings (`/admin/settings`)
- UI: `AdminSettings`
- APIs:
  - `GET /api/admin/settings/billing-tariff`
  - `PUT /api/admin/settings/billing-tariff`
- Flow:
  - Configure and persist tariff slab rules in `app_settings`

### 4.12 Admin Profile (`/admin/profile`)
- UI: `AdminProfile`
- API:
  - `GET /api/admin/staff`
- Flow:
  - Frontend matches logged-in `userId` with staff list and shows own profile

---

## 5) Member Panel Technical Flow

Base layout: `frontend/src/app/pages/member/MemberLayout.tsx`

### 5.1 Dashboard (`/member/dashboard`)
- UI: `MemberDashboard`
- API:
  - `GET /api/member/overview`
- Flow:
  - Member sees account summary, latest bill state, and pending counts

### 5.2 Usage (`/member/usage`)
- UI: `MemberUsage`
- API:
  - `GET /api/member/bills`
- Flow:
  - Displays usage and bill-period level records

### 5.3 Billing (`/member/billing`)
- UI: `MemberBilling`
- API:
  - `GET /api/member/profile`
- Flow:
  - Reads bill list from profile payload
  - Shows current bill + history + PDF export

### 5.4 Payments (`/member/payments`)
- UI: `MemberPayments`
- Flow:
  - Frontend payment UX placeholder (gateway integration pending)

### 5.5 Complaints (`/member/complaints`)
- UI: `MemberComplaints`
- APIs:
  - `POST /api/member/complaints`
  - `GET /api/member/complaints`
  - `GET /api/member/complaints/{complaint_id}/updates`
- Flow:
  - Member submits complaint
  - Tracks assigned worker and latest progress
  - Opens timeline dialog for full maintenance updates

### 5.6 Notifications (`/member/notifications`)
- UI: `MemberNotifications`
- APIs:
  - `GET /api/member/notifications`
  - `PATCH /api/member/notifications/{notif_id}/read`
- Flow:
  - Displays targeted admin notifications
  - Marks notification as read on interaction

### 5.7 Announcements (`/member/announcements`)
- UI: `MemberAnnouncements`
- API:
  - `GET /api/announcements`
- Flow:
  - Read shared system-wide announcements published by admin

### 5.8 Schedule (`/member/schedule`)
- UI: `MemberSchedule`
- Flow:
  - Client-side schedule section (no dedicated backend endpoint at present)

### 5.9 Member Profile (`/member/profile`)
- UI: `MemberProfile`
- API:
  - `GET /api/member/profile`
- Flow:
  - Shows connection details, contact, location, and account identifiers

---

## 6) Backend Domain Models and Data Flow

Core backend file: `backend/main.py`

### Main entities
- `Admin`
- `Member`
- `City`
- `WaterDailyEntry`
- `Bill`
- `Worker`
- `Complaint`
- `ComplaintUpdate`
- `Notification`
- `Announcement`
- `AppSetting`

### Complaint lifecycle
1. Member submits complaint -> `POST /api/member/complaints`
2. Admin views in alerts/maintenance -> `GET /api/admin/complaints`
3. Admin assigns worker/status -> `PATCH /api/admin/complaints/{id}`
4. Admin posts progress update -> `POST /api/admin/complaints/{id}/updates`
5. Member views timeline -> `GET /api/member/complaints/{id}/updates`
6. System notification generated on assignment/in-progress/resolved updates

### Announcement lifecycle
1. Admin publishes -> `POST /api/admin/announcements`
2. Stored in `announcements` table
3. Visible to all via `GET /api/announcements`

---

## 7) Full API Index

### Public / General
- `GET /`
- `GET /api/health`
- `GET /api/villages`
- `GET /api/cities`
- `POST /api/cities`
- `POST /api/register/admin`
- `POST /api/register/member`
- `POST /api/login`
- `GET /api/water/entry-meta`
- `POST /api/water/entries`
- `GET /api/water/entries`
- `POST /api/water/reset`
- `GET /api/analytics/dashboard`
- `GET /api/analytics/leakage`
- `GET /api/announcements`

### Admin-only
- `GET /api/admin/settings/billing-tariff`
- `PUT /api/admin/settings/billing-tariff`
- `GET /api/admin/members`
- `GET /api/admin/members/{member_id}`
- `PATCH /api/admin/members/{member_id}`
- `PATCH /api/admin/bills/{bill_id}`
- `POST /api/admin/members/{member_id}/generate-bill`
- `GET /api/admin/staff`
- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/{complaint_id}`
- `GET /api/admin/complaints/{complaint_id}/updates`
- `POST /api/admin/complaints/{complaint_id}/updates`
- `GET /api/admin/workers`
- `POST /api/admin/workers`
- `POST /api/admin/alerts`
- `POST /api/admin/announcements`

### Member-only
- `GET /api/member/profile`
- `GET /api/member/bills`
- `GET /api/member/overview`
- `POST /api/member/complaints`
- `GET /api/member/complaints`
- `GET /api/member/complaints/{complaint_id}/updates`
- `GET /api/member/notifications`
- `PATCH /api/member/notifications/{notif_id}/read`

---

## 8) Notes for Extension

- Add announcement pin/priority/expiry fields for controlled visibility.
- Add server-side unread count endpoint for navbar optimization.
- Add dedicated admin profile endpoint to avoid staff-list filtering in frontend.
- Add member schedule backend APIs if schedule must become data-driven.

