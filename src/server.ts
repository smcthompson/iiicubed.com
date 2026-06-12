// Entry point for the application server.
import 'dotenv/config';
import express from 'express';
import { buildStatus } from '@/routes';
import { HomePage } from '@/pages';
import { enableDevLiveReload } from '@/services';

const app = express();
const port = Number(process.env.PORT ?? 3000);

enableDevLiveReload(app);

app.get('/', (_req, res) => {
  res.send(HomePage());
});

app.use(
  buildStatus,
  express.static('public'),
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
