# Test Prep Portfolio

A Next.js + Prisma practice-testing app with separate student and admin workflows.

## Tech stack
- Next.js 14 (App Router)
- React 18
- Prisma ORM
- TailwindCSS

## Features
- Student test setup, timed practice flow, and results review
- Admin subject and question management
- Excel import for question banks
- Cookie-based admin authentication

## Public-safe setup
This repository intentionally **does not include real credentials**.

1. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in secure values for:
   - `AUTH_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `DATABASE_URL`
3. Run install and migrations:
   ```bash
   npm install
   npx prisma migrate dev
   npm run prisma:seed
   npm run dev
   ```

## Auth model
- Login posts to `/api/auth/login`
- Server sets an `httpOnly` `admin_session` cookie
- `middleware.ts` protects `/admin/*`

## Notes
- `/api/diag` is disabled for public deployments.
- Do not commit `.env*` files with real values.
