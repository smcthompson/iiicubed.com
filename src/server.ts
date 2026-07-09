// Entry point for the application server.
import '#/shared/config/loadEnvironment.js';
import express from 'express';
import { buildStatus, workstationRoutes } from '#/routes';
import { HomePage } from '#/pages';
import { enableDevLiveReload } from '#/services';

const app = express();
const port = Number(process.env.PORT ?? 3000);

enableDevLiveReload(app);

app.get('/', (_req, res) => {
  res.send(HomePage());
});

app.use(buildStatus);
app.use(workstationRoutes);
app.use(express.static('public'));

app.listen(port, () => {
  // Startup log is intentional for local and CI smoke diagnostics.
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${port}`);
});
