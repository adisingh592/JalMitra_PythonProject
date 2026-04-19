# JalMitra Admin User Management & Billing Implementation
## Progress: 0/12 [ ] 

### Backend Changes (4 steps)

- [x] 1. Add Bill model/table to backend/main.py & schema.sql + migration
- [x] 2. Add APIs: GET /api/admin/members (list + bill summary), GET/PATCH /api/admin/members/{id}
- [x] 3. Update seed_db.py to add dummy members + bills
- [ ] 4. Test backend APIs (manual: restart backend `uvicorn backend.main:app --reload`, run `python backend/seed_db.py`, curl http://localhost:8000/api/admin/members -H "Authorization: mock-jwt-admin-1")


### Frontend Changes (6 steps)
- [ ] 5. Update AdminDashboard.tsx: Add Users tab/section with Table (name,village,bill,status,actions)
- [ ] 6. Add row-click Dialog for profile view + edit form (phone,email,password)
- [ ] 7. Add bill paid toggle/status badge in table/Dialog
- [ ] 8. Fetch data via existing apiUrl, handle loading/error
- [ ] 9. Style with shadcn Table/Dialog/Form/Badge
- [ ] 10. Update routes.tsx or sidebar if needed (/admin/users -> new view)

### Testing/Deployment (2 steps)
- [ ] 11. Run seed_db.py, restart backend/frontend, test full flow
- [ ] 12. Demo: Login admin, view users/bills, edit profile, check paid status

**Next step: Backend Bill model + APIs**

