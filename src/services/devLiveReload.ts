import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, Response } from 'express';
import { spawn } from 'node:child_process';

const DEV_RELOAD_EVENTS_PATH = '/__dev/reload';
const DEV_RELOAD_CLIENT_PATH = '/__dev/reload-client.js';

export function enableDevLiveReload(app: Express): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const clients = new Set<Response>();
  let heartbeatTimer: NodeJS.Timeout | undefined;

  app.get(DEV_RELOAD_EVENTS_PATH, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write('retry: 1000\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
      res.end();
    });
  });

  app.get(DEV_RELOAD_CLIENT_PATH, (_req: Request, res: Response) => {
    res.type('application/javascript').send(`(() => {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return;
  }

  const source = new EventSource('${DEV_RELOAD_EVENTS_PATH}');
  let hasConnected = false;
  let wasDisconnected = false;

  source.addEventListener('open', () => {
    if (hasConnected && wasDisconnected) {
      window.location.reload();
      return;
    }

    hasConnected = true;
    wasDisconnected = false;
  });

  source.addEventListener('error', () => {
    wasDisconnected = true;
  });

  source.addEventListener('reload', () => {
    window.location.reload();
  });
})();`);
  });

  const watchedRoots = ['src', 'public'].map((relativePath) => path.resolve(process.cwd(), relativePath)).filter((absolutePath) => fs.existsSync(absolutePath));

  let debounceTimer: NodeJS.Timeout | undefined;

  const notifyReload = () => {
    for (const client of clients) {
      client.write('event: reload\ndata: changed\n\n');
    }
  };

  const scheduleReload = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(notifyReload, 150);
  };

  // Watch SCSS directory and run the CSS build when SCSS changes are detected.
  const scssDir = path.resolve(process.cwd(), 'src', 'scss');
  let buildDebounceTimer: NodeJS.Timeout | undefined;

  const scheduleCssBuild = () => {
    if (buildDebounceTimer) {
      clearTimeout(buildDebounceTimer);
    }

    buildDebounceTimer = setTimeout(() => {
      // Run the npm script to build CSS.
      const child = spawn('npm', ['run', 'build:css'], { shell: true, stdio: 'inherit' });
      child.on('close', (code) => {
        // eslint-disable-next-line no-console
        console.log(`[dev-reload] npm run build:css exited with code ${code}`);
        // After CSS is rebuilt, trigger a reload so clients pick up the new CSS.
        scheduleReload();
      });
      child.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('[dev-reload] failed to run build:css', err);
      });
    }, 150);
  };

  heartbeatTimer = setInterval(() => {
    for (const client of clients) {
      client.write(': heartbeat\n\n');
    }
  }, 15000);

  const watchers = watchedRoots.map((rootPath) =>
    fs.watch(rootPath, { recursive: true }, (_eventType, fileName) => {
      if (!fileName) {
        return;
      }

      if (String(fileName).includes('.swp')) {
        return;
      }

      scheduleReload();
    }),
  );

  // Add SCSS watcher if the directory exists
  if (fs.existsSync(scssDir)) {
    const scssWatcher = fs.watch(scssDir, (eventType, fileName) => {
      if (!fileName) return;
      const name = String(fileName);
      if (!name.endsWith('.scss')) return;
      // eslint-disable-next-line no-console
      console.log(`[dev-reload] SCSS change detected: ${name} (${eventType})`);
      scheduleCssBuild();
    });

    watchers.push(scssWatcher);
  }

  const cleanup = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }

    for (const watcher of watchers) {
      watcher.close();
    }

    for (const client of clients) {
      client.end();
    }
  };

  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);

  // Diagnostic output is useful during local development.
  // eslint-disable-next-line no-console
  console.log(`[dev-reload] watching ${watchedRoots.length} path(s)`);
}
