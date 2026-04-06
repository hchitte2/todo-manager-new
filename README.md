# Todo Manager — Express + React

Full-stack todo list app with JWT auth, built with Express/TypeScript (backend) and React/Vite (frontend).

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Express, TypeScript, SQLite, JWT |
| Frontend | React, Vite, TypeScript |
| Testing | Jest, Supertest, Vitest, Playwright |

---

## New Features Added

### Backend
- **Toggle todo completion** — `PATCH /lists/:id/todos/:todoId` flips a todo between complete/incomplete
- **Delete todo** — `DELETE /lists/:id/todos/:todoId`
- **Delete list** — `DELETE /lists/:id` (cascades to all todos)
- **User-scoped lists** — lists now have a `user_id` column; each user only sees their own lists
- **CORS** — added `PATCH` and `DELETE` to allowed methods
- **Token expiry** — extended access token from 30s → 1h for usability

### Frontend UI/UX
- **Two-column layout** — auth sidebar stays fixed; workspace expands on login
- **Todo completion checkbox** — check a todo to mark it done with strikethrough
- **Delete buttons (×)** — per todo and per list card
- **Color-coded status banner** — green for success, red for errors
- **Progress bars** — global (sidebar) and per-list showing completed/total
- **User avatar** — shows first initial of logged-in email
- **Responsive grid** — list cards flow into columns on wide screens
- **Empty state** — placeholder when no lists exist

---

## Running the App

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install

# Terminal 1 — backend
npm start

# Terminal 2 — frontend
npm run dev:frontend
```

Open **http://localhost:5173**

---

## Running Tests

```bash
# Unit + integration tests (backend + frontend)
npm test

# E2E tests — stop servers first, Playwright manages its own
kill $(lsof -ti :3002) 2>/dev/null
kill $(lsof -ti :5173) 2>/dev/null
npm run test:e2e
```

### Test coverage

| Suite | Tests | What's covered |
|---|---|---|
| `listService.test.ts` | 15 unit | create, update, delete list; create, toggle, delete todo |
| `listsController.test.ts` | 12 unit | all controller handlers incl. new PATCH/DELETE endpoints |
| `appRoutes.test.ts` | 8 integration | full HTTP flows via Supertest |
| `AuthApp.test.tsx` | 13 frontend | auth flow, completion toggle, delete, progress count |
| `e2e/app.spec.ts` | 7 E2E | signup → login → CRUD → toggle → delete → logout |

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login → returns access token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear refresh token |

### Lists (all require `Authorization: Bearer <token>`)
| Method | Path | Description |
|---|---|---|
| GET | `/lists` | Get user's lists with todos |
| POST | `/lists` | Create list |
| POST | `/lists/:id` | Update list name |
| DELETE | `/lists/:id` | Delete list |
| POST | `/lists/:id/todos` | Add todo to list |
| PATCH | `/lists/:id/todos/:todoId` | Toggle todo completion |
| DELETE | `/lists/:id/todos/:todoId` | Delete todo |

Swagger docs available at **http://localhost:3002/api-docs**
