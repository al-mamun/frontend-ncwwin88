# frontend-mcwwin87

Client website for **mcwwin87.com** — a dedicated copy of the multi-tenant player frontend, deployed as its own GitHub repo + Vercel project.

Shares the same NestJS backend (`api.superparibet.com`). The tenant is resolved from the request host (`NEXT_PUBLIC_TENANT_MODE=host`), so on `mcwwin87.com` it loads that tenant's branding, games, and config. A new visual design can be added later as a theme under `src/themes/`.

## Setup (new PRIVATE repo + Vercel project)

In **Git Bash**, from inside this folder:

```bash
cd /f/wamp64/www/casinoapp/app-rebuild/frontend-mcwwin87
rm -rf .git
git init
git rev-parse --show-toplevel   # must print .../frontend-mcwwin87 before continuing
git add -A
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/al-mamun/frontend-mcwwin87.git
git push -u origin main
```

(Create the GitHub repo **private** and empty first — no README.)

## Vercel

1. Import the repo as a new project (Next.js auto-detected).
2. Environment Variables (Production) — from `.env.production.example` (key: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_TENANT_MODE=host`).
3. Domains on the **frontend** project: `mcwwin87.com`, `www.mcwwin87.com` (apex->www), `affiliate.mcwwin87.com`.
4. Domain on the **dashboard** project (`casino-platform-dashboard`): `admin.mcwwin87.com`.

## DNS records (wherever mcwwin87.com DNS is hosted)

| Type  | Host        | Value                  |
|-------|-------------|------------------------|
| A     | `@`         | `216.198.79.1`         |
| CNAME | `www`       | `cname.vercel-dns.com` |
| CNAME | `affiliate` | `cname.vercel-dns.com` |
| CNAME | `admin`     | `cname.vercel-dns.com` |

## Backend

Register `mcwwin87.com` (+ subdomains) on the mcwwin87 tenant in the dashboard, and ensure backend CORS allows it, so `/public/tenant/resolve` matches the host.

## Notes

Clean copy of `frontend-nextjs` (source + config only — no `node_modules`, `.next`, git history). Run `npm install` before first build.
