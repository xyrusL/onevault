# OneVault

An edge-native, zero-trust cloud vault and domain management platform built on **React 19**, **Tailwind CSS**, and **Cloudflare Workers** with **D1 Database**.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS. Hosted on **Vercel** or Cloudflare Pages/Worker static assets.
- **Backend / API**: Cloudflare Workers (`worker/src/index.ts`) with Hono framework, running globally at the edge 24/7.
- **Database**: Cloudflare D1 SQL database (`onevault-storage`).
- **Email Engine**: Cloudflare Email Routing with worker routing rules.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- Cloudflare account with D1 and Email Routing enabled
- Cloudflare Wrangler CLI (`npm i -g wrangler` or via local devDependencies)

### 2. Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/xyrusL/onevault.git
   cd onevault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Cloudflare credentials and session secret in `.env`.

4. Run the local D1 migrations:
   ```bash
   npm run db:migrate:local
   ```

5. Start development servers:
   ```bash
   # Terminal 1: Cloudflare Worker API
   npm run dev:worker

   # Terminal 2: React Frontend (Vite)
   npm run dev
   ```

---

## Production Deployment

### 1. Deploy Cloudflare Worker (24/7 Edge Backend)

1. Apply migrations to your remote Cloudflare D1 database:
   ```bash
   npm run db:migrate:remote
   ```

2. Push production secrets to Cloudflare:
   ```bash
   wrangler secret put CF_API_TOKEN
   wrangler secret put ADMIN_EMAIL
   wrangler secret put ADMIN_PASSWORD
   wrangler secret put SESSION_SECRET
   ```

3. Deploy the worker:
   ```bash
   npm run cf:deploy
   ```
   Note your deployed worker URL (e.g., `https://onevault-worker.<subdomain>.workers.dev`).

### 2. Deploy Frontend to Vercel

1. Import your GitHub repository (`xyrusL/onevault`) in the [Vercel Dashboard](https://vercel.com).
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. In **Environment Variables**, add:
   - `VITE_WORKER_URL`: `https://onevault-worker.<subdomain>.workers.dev`
6. Click **Deploy**.

---

## License

Private / Proprietary.
