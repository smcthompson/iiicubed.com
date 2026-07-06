import { Router } from 'express';
import { getWorkstationApplication } from '#/app/workstation/WorkstationApplication.js';

const workstationRoutes = Router();

workstationRoutes.get('/workstation', (_req, res) => {
  res.redirect('/workstation/foundation');
});

workstationRoutes.get('/workstation/foundation', (_req, res) => {
  res.send(`
    <main>
      <h1>Workstation Constraint Framework</h1>
      <p>Foundation milestone route registered.</p>
      <button hx-get="/api/workstation/foundation/status" hx-target="#workstation-status">
        Check Workstation Foundation Status
      </button>
      <pre id="workstation-status"></pre>
    </main>
  `);
});

workstationRoutes.get('/api/workstation/foundation/status', async (_req, res, next) => {
  try {
    const application = await getWorkstationApplication();
    const status = await application.getFoundationStatus.execute();

    res.type('text/plain').send(JSON.stringify(status, null, 2));
  } catch (error) {
    next(error);
  }
});

export { workstationRoutes };
