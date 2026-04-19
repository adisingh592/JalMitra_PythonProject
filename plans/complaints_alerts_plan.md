# Complaints and Notifications Implementation Plan

This plan details the steps required to implement the two-way communication system:
1. Members submitting complaints that Admins can view.
2. Admins sending specific, targeted alerts to members.

## Proposed Changes

### Database Changes (Backend `main.py`)
- **[NEW TABLE] `complaints`**: `id`, `member_id`, `type`, `description`, `status` (pending/in-progress/resolved), `created_at`.
- **[NEW TABLE] `notifications`**: `id`, `member_id`, `type`, `title`, `message`, `is_read`, `created_at`.

### Backend APIs (`main.py`)
- **[NEW] `POST /api/member/complaints`**: Allows members to submit a new complaint.
- **[NEW] `GET /api/member/complaints`**: Allows members to fetch their own complaint history.
- **[NEW] `GET /api/admin/complaints`**: Allows admins to fetch all member complaints.
- **[NEW] `PATCH /api/admin/complaints/{id}`**: Allows admins to update the status of a complaint (e.g., mark as "resolved").
- **[NEW] `POST /api/admin/alerts`**: Allows admins to send a targeted alert to a specific member.
- **[NEW] `GET /api/member/notifications`**: Allows members to fetch their targeted alerts.
- **[NEW] `PATCH /api/member/notifications/{id}/read`**: Allows members to mark an alert as read.

### Frontend Updates (Admin Portal)
- **[NEW] `frontend/src/app/pages/admin/AdminAlerts.tsx`**: 
  - A new page divided into two sections.
  - **Section 1 (Send Alert)**: A form where the admin can select a specific member (from the member list), choose an alert type (Higher Water Usage, Leakage, Bill Repayment), and send a custom message.
  - **Section 2 (Member Complaints)**: A table displaying all complaints submitted by members, allowing the admin to view them and update their status.
- **[MODIFY] `frontend/src/app/routes.tsx`**: Route `/admin/alerts` to the new `AdminAlerts` component instead of `AdminDashboard`.

### Frontend Updates (Member Portal)
- **[MODIFY] `frontend/src/app/pages/member/MemberComplaints.tsx`**: Replace the hardcoded mock complaints with a real API call to `/api/member/complaints`. Hook up the "File New Complaint" form to `POST /api/member/complaints`.
- **[MODIFY] `frontend/src/app/pages/member/MemberNotifications.tsx`**: Replace the hardcoded mock notifications with a real API call to `/api/member/notifications`. Add logic to mark alerts as read when clicked.
