# MySQL Backend and React Frontend Login Integration

This plan details the steps to replace our mock login with a real database connection. The backend will use FastAPI to query a MySQL database, and the frontend will use Axios to submit credentials and handle the response.

## Proposed Changes

### Backend Setup (FastAPI + MySQL)
#### [MODIFY] requirements.txt
- Add `pymysql` and `sqlalchemy` to handle database connections safely.

#### [MODIFY] main.py
- Set up the SQLAlchemy database engine using your MySQL credentials.
- Modify the `POST /login` route to query the `users` table.
- Implement strict validation: only return success with `{role, user_id}` if credentials match exactly, otherwise return `401 Invalid credentials`.

### Frontend Setup (React + Axios)
#### Dependency Installation
- Run `pnpm add axios` in the `e:\jlmiotra\frontend` directory.

#### [MODIFY] AuthContext.tsx
- Update context to store more detailed user data (e.g., `user_id` and auth token) in addition to the `role`.

#### [MODIFY] LoginPage.tsx
- Add an error state to display "Invalid credentials" when the backend rejects the login.
- Update the `handleLogin` function to make an `axios.post('http://localhost:8000/login', ...)` request.
- On success, call `AuthContext.login()` with the received role and token.
- Rely on our existing `useEffect` logic to automatically trigger the role-based navigation (redirect `admin` -> `/admin/dashboard`, `member` -> `/member/dashboard`).
