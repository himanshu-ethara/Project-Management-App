# TaskFlow — Project Management App

A full-stack project management application with **role-based access control**, task tracking, and a real-time dashboard. Built with Node.js, Express, PostgreSQL (Prisma), and a Vanilla JS SPA frontend.

---

## 🚀 Live Demo

> **Live URL:** *(https://project-management-app-production-c753.up.railway.app/)*  
> **GitHub:** *(https://github.com/himanshu-ethara/Project-Management-App)*

---

## ✨ Features

- **Authentication** — JWT-based register & login
- **Projects** — Create, edit, delete projects
- **Team Management** — Invite members by email, assign Admin or Member roles
- **Tasks** — Kanban board (To Do / In Progress / Done), priority levels, due dates, assignees
- **Dashboard** — Task stats, status breakdown chart, overdue tasks, recent activity
- **RBAC** — Admins manage everything; Members can view and update task status
- **Responsive** — Mobile-friendly dark UI

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Frontend | HTML + CSS + Vanilla JS (SPA) |
| Deployment | Railway |

---

## 📦 Local Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd .assessment
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL and JWT_SECRET
```

### 4. Run database migrations
```bash
npx prisma migrate dev --name init
```

### 5. Start the dev server
```bash
npm run dev
```

Visit `http://localhost:4000`

---

## 🚂 Deploy on Railway

1. Push code to a GitHub repo
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Add a **PostgreSQL** plugin to your project
4. Set environment variables in Railway dashboard:
   - `JWT_SECRET` → any long random string
   - `DATABASE_URL` → auto-injected by Railway PostgreSQL plugin
   - `NODE_ENV` → `production`
5. Railway will auto-detect `railway.toml` and run:
   ```
   npx prisma migrate deploy && node src/index.js
   ```
6. Your app will be live on a `*.up.railway.app` URL

---

## 📁 Project Structure

```
.assessment/
├── prisma/
│   └── schema.prisma        # DB schema (User, Project, Member, Task)
├── src/
│   ├── index.js             # Express entry point
│   ├── middleware/          # auth, roleCheck, errorHandler
│   ├── routes/              # auth, projects, members, tasks, dashboard
│   ├── controllers/         # Business logic for each resource
│   ├── utils/               # JWT + bcrypt helpers
│   └── lib/prisma.js        # Prisma client singleton
├── client/
│   ├── index.html           # SPA shell
│   ├── css/style.css        # Dark theme design system
│   └── js/
│       ├── api.js           # Fetch wrapper
│       ├── app.js           # SPA router + session
│       ├── auth.js          # Login/register UI
│       ├── dashboard.js     # Dashboard view
│       ├── projects.js      # Projects list + detail
│       └── tasks.js         # Kanban board + task modals
├── railway.toml             # Railway deployment config
├── package.json
└── .env.example
```

---

## 🔑 API Endpoints

| Method | Endpoint | Auth | Role |
|---|---|---|---|
| POST | `/api/auth/register` | ✗ | — |
| POST | `/api/auth/login` | ✗ | — |
| GET | `/api/auth/me` | ✓ | Any |
| GET | `/api/projects` | ✓ | Any |
| POST | `/api/projects` | ✓ | Any |
| GET | `/api/projects/:id` | ✓ | Member+ |
| PUT | `/api/projects/:id` | ✓ | Admin |
| DELETE | `/api/projects/:id` | ✓ | Admin |
| GET | `/api/projects/:id/members` | ✓ | Member+ |
| POST | `/api/projects/:id/members` | ✓ | Admin |
| PUT | `/api/projects/:id/members/:userId` | ✓ | Admin |
| DELETE | `/api/projects/:id/members/:userId` | ✓ | Admin |
| GET | `/api/projects/:id/tasks` | ✓ | Member+ |
| POST | `/api/projects/:id/tasks` | ✓ | Admin |
| PUT | `/api/tasks/:id` | ✓ | Admin/Assignee |
| PATCH | `/api/tasks/:id/status` | ✓ | Member+ |
| DELETE | `/api/tasks/:id` | ✓ | Admin |
| GET | `/api/dashboard` | ✓ | Any |
| GET | `/api/health` | ✗ | — |

---

## 👤 Role Permissions

| Action | Admin | Member |
|---|---|---|
| View project | ✅ | ✅ |
| Edit/Delete project | ✅ | ❌ |
| Manage members | ✅ | ❌ |
| Create/Delete tasks | ✅ | ❌ |
| Edit any task | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Edit assigned task | ✅ | ✅ |
