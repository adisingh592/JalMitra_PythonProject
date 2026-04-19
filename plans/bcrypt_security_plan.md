# Bcrypt Password Security and Logout Redirect

This plan details the steps to enhance the FastAPI backend security by implementing password hashing using `bcrypt`, and fixing the frontend logout button to redirect to `/login`.

## Proposed Changes

### Frontend Fixes
#### [MODIFY] Navbar.tsx
- Update the `handleLogout` function to redirect to `/login` instead of `/` after clearing `localStorage`.

### Backend Security Upgrade
#### [MODIFY] requirements.txt
- Add `passlib[bcrypt]` to handle password hashing.

#### [MODIFY] main.py
- Import `CryptContext` from `passlib.context`.
- Initialize `pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")`.
- Update the `/api/login` endpoint to use `pwd_context.verify(data.password, user.password)` instead of doing a plain-text comparison (`==`).
- **[NEW ROUTE]** Add a `POST /api/register` endpoint that takes a `username`, `password`, and `role`. It will use `pwd_context.hash(password)` before saving the new user to the database.
