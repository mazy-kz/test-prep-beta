# Test Prep Portfolio

A public, portfolio-ready **Next.js + Prisma** app for running multiple-choice practice tests with separate student and admin experiences.

## ✨ What this project includes
- Student flow to pick a subject, run a quiz session, and review results.
- Admin flow to manage subjects/questions and import question banks from Excel.
- Cookie-based admin authentication (`admin_session`) with server-side validation.
- Prisma data model and seed script for quick local setup.

## 🧱 Tech stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Prisma ORM

## 📁 Project structure
- `src/app/` — app routes (pages + API routes)
- `src/app/(site)/student` — student quiz experience
- `src/app/(site)/admin` — admin dashboard
- `src/app/api` — REST-style endpoints (auth, subjects, questions, imports)
- `src/lib` — shared helpers (branding, auth utilities, classnames)
- `src/components/ui` — reusable UI primitives
- `prisma/` — schema, migrations, and seed script

## 🚀 Local development
### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy the template and set your own values:
```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 3) Prepare database
```bash
npx prisma migrate dev
npm run prisma:seed
```

### 4) Run the app
```bash
npm run dev
```
Open `http://localhost:3000`.

## 🔐 Public-repo safety notes
This repository is designed to be public:
- No real credentials are stored in source control.
- `.env*` files are gitignored.
- Auth depends on runtime environment variables.
- Diagnostic internals endpoint (`/api/diag`) is disabled in public builds.

Before publishing your own fork:
1. Rotate any credentials previously used in private environments.
2. Double-check git history for accidental secrets.
3. Ensure deployment platform env vars are configured securely.

## 🧪 Quality checks
Run a production build before opening a PR:
```bash
npm run build
```

## 🤝 Contributing
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting changes.

## 🔒 Security
Please read [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## 📄 License
This project is released under the [MIT License](./LICENSE).
