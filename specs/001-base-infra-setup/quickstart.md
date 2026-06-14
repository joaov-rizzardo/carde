# Quickstart Validation Guide: Project Base Infrastructure

**Validates**: Acceptance scenarios from [spec.md](./spec.md) | **Contracts**: [env-contract.md](./contracts/env-contract.md), [api-response.md](./contracts/api-response.md)

---

## Prerequisites

- Node.js 20+ and npm installed
- A Supabase project created with connection strings available (Settings → Database)
- A Vercel account linked to the GitHub repository
- All variables from `.env.example` filled in `.env.local`

---

## Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Apply initial migration (creates empty schema baseline in Supabase)
npx prisma migrate dev --name init

# 4. Start development server
npm run dev
```

---

## Acceptance Scenario 1 — App starts with valid env (US1, SC-001)

**Expected**: Server starts, browser shows default page at `http://localhost:3000`.

```bash
# With .env.local populated:
npm run dev
# → Should print: "✓ Ready in X.Xs" with no errors
```

**Check**: Open `http://localhost:3000` — a page renders (marketing placeholder). Open `http://localhost:3000/dashboard` — a page renders (dashboard placeholder). No console errors.

---

## Acceptance Scenario 2 — Missing env variable causes clear error (FR-001, SC-002)

**Expected**: Application crashes at startup with the variable name in the error.

```bash
# Temporarily remove or rename a required variable in .env.local, then:
npm run dev
# → Should print a ZodError naming the missing variable before "Ready"
# Example: ZodError: [ { path: ["DATABASE_URL"], message: "Invalid url" } ]
```

**Restore** the variable before continuing.

---

## Acceptance Scenario 3 — Brand typography renders (US1 Scenario 3, SC-004)

**Expected**: The default page uses Playfair Display for headings and Inter for body text; no horizontal scroll at 320px.

1. Open `http://localhost:3000` in Chrome DevTools mobile (iPhone SE, 375px).
2. Inspect a heading element → computed font-family should include `Playfair Display`.
3. Set viewport to 320px → no horizontal scrollbar appears.

---

## Acceptance Scenario 4 — Route protection wired (FR-003)

**Expected**: `/dashboard` and `/onboarding` are processed by middleware.

```bash
# In another terminal:
curl -v http://localhost:3000/dashboard 2>&1 | grep -E "(< HTTP|Location)"
# For now (auth not yet implemented), expect: HTTP/1.1 200
# After auth feature: expect HTTP/1.1 307 + Location: /login
```

Verify `middleware.ts` matcher includes both patterns — the redirect behaviour is validated in the auth feature spec.

---

## Acceptance Scenario 5 — Database connection works (US2 Scenario 3)

**Expected**: Prisma can execute a query against Supabase without connection errors.

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1 + 1 AS result\`
  .then(r => { console.log('DB OK:', r); process.exit(0); })
  .catch(e => { console.error('DB FAIL:', e.message); process.exit(1); });
"
```

---

## Acceptance Scenario 6 — TypeScript strict build passes (FR-008, SC-005)

**Expected**: Zero TypeScript errors.

```bash
npx tsc --noEmit
# → No output = pass
```

---

## Acceptance Scenario 7 — Vercel deployment (US2, SC-003, SC-006)

**Expected**: Push to `main` triggers automatic Vercel deployment within 5 minutes.

1. Push a trivial change to the `main` branch.
2. Open Vercel dashboard → verify build completes without errors.
3. Open the deployment URL → page loads and DB connection is healthy.
4. Measure response time with DevTools Network tab → initial HTML < 3 s on simulated 4G.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `ZodError` on startup | Missing or malformed `.env.local` variable | Check error path field; compare against `.env.example` |
| `Can't reach database server` | Wrong port in `DATABASE_URL` | Use port 6543 (pooler) for `DATABASE_URL`, port 5432 for `DIRECT_URL` |
| `Prepared statement "s0" already exists` | Missing `?pgbouncer=true` in `DATABASE_URL` | Append `?pgbouncer=true&connection_limit=1` |
| Font not loading locally | Missing `subsets: ['latin']` in font config | Check `app/layout.tsx` font declarations |
| Vercel build fails on missing env | Env vars not added to Vercel project settings | Add all variables in Vercel → Settings → Environment Variables |
