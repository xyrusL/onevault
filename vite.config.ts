import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const WORKER_HOST = '127.0.0.1';
const WORKER_PORT = 8787;
const WORKER_STARTUP_TIMEOUT_MS = 10_000;
const WORKER_POLL_INTERVAL_MS = 150;

function isWorkerPortListening(
  port = WORKER_PORT,
  host = WORKER_HOST
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.setTimeout(300);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function waitForWorkerReady(): Promise<boolean> {
  const deadline = Date.now() + WORKER_STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await isWorkerPortListening()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, WORKER_POLL_INTERVAL_MS));
  }
  return false;
}

/**
 * Automatically starts the local Wrangler worker alongside `vite` (`npm run dev`)
 * and waits for port 8787 before forwarding `/api/*` requests so cold starts never
 * fail with proxy connection errors.
 */
function oneVaultLocalWorkerPlugin(): Plugin {
  return {
    name: 'onevault-local-worker',
    apply: 'serve',
    configureServer(server) {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      let workerProcess: ChildProcess | null = null;
      let workerStartPromise: Promise<void> | null = null;

      const stopWorker = () => {
        if (workerProcess && !workerProcess.killed) {
          workerProcess.kill();
          workerProcess = null;
        }
      };

      server.httpServer?.once('close', stopWorker);
      process.once('exit', stopWorker);

      const ensureWorkerRunning = async (): Promise<void> => {
        if (await isWorkerPortListening()) return;
        if (!workerStartPromise) {
          workerStartPromise = (async () => {
            if (await isWorkerPortListening()) return;
            const wranglerBin = path.resolve(
              process.cwd(),
              'node_modules/wrangler/bin/wrangler.js'
            );
            workerProcess = spawn(
              process.execPath,
              [wranglerBin, 'dev', '--port', String(WORKER_PORT), '--ip', WORKER_HOST],
              {
                cwd: process.cwd(),
                stdio: 'inherit',
                env: process.env,
              }
            );
            workerProcess.once('exit', () => {
              workerProcess = null;
              workerStartPromise = null;
            });
          })();
        }
        await workerStartPromise;
      };

      void ensureWorkerRunning();

      server.middlewares.use('/api', async (_req, _res, next) => {
        try {
          await ensureWorkerRunning();
          if (!(await isWorkerPortListening())) {
            await waitForWorkerReady();
          }
        } finally {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    oneVaultLocalWorkerPlugin(),
  ],
  server: {
    // `npm run dev` (Vite) auto-starts `wrangler dev` on port 8787 if not already running
    proxy: {
      '/api': {
        target: `http://${WORKER_HOST}:${WORKER_PORT}`,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if ('writeHead' in res && typeof res.writeHead === 'function') {
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: `Local worker unavailable on ${WORKER_HOST}:${WORKER_PORT} (${err.message}).`,
                  })
                );
              }
            } else if ('destroy' in res && typeof res.destroy === 'function') {
              res.destroy();
            }
          });
        },
      },
    },
  },
});
