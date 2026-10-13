# OneVault

An edge-native, zero-trust cloud vault and domain management platform built on **React 19**, **Tailwind CSS**, and **Cloudflare Workers** with **D1 Database**.

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS served via **Cloudflare Workers Static Assets** (free, unlimited requests & bandwidth).
- **Backend / API**: Cloudflare Workers (`worker/src/index.ts`) with Hono framework, running globally at `/api/*` 24/7.
- **Database**: Cloudflare D1 SQL database (`onevault-storage`).
- **Email Engine**: Cloudflare Email Routing with worker routing rules.
- **Live Domain**: [`https://onevault.ainxe.com`](https://onevault.ainxe.com)

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

3. Set up local secrets:
   ```bash
   cp .env.example .dev.vars
   ```
   Fill in your Cloudflare credentials and session secret in `.dev.vars`.

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

## Production Deployment (100% Cloudflare)

Both the React frontend (`./dist`) and the Hono backend (`worker/src/index.ts`) deploy together in a single command to **`https://onevault.ainxe.com`**:

1. **Apply D1 Migrations to Remote Database**:
   ```bash
   npm run db:migrate:remote
   ```

2. **Upload Production Secrets**:
   ```bash
   npx wrangler secret bulk .dev.vars
   ```

3. **Build & Deploy (Frontend + Backend Worker)**:
   ```bash
   npm run cf:deploy
   ```

### Optional: Automatic GitHub Deployments on Cloudflare
In the [Cloudflare Dashboard](https://dash.cloudflare.com/) under **Workers & Pages > `onevault-worker` > Settings > Builds**, connect your GitHub repository (`xyrusL/onevault`):
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

Every `git push` to `main` will automatically build Vite + TypeScript and deploy to `https://onevault.ainxe.com`.

---

## License

Private / Proprietary.
