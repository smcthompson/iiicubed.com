// Entry point for the application server.
import 'dotenv/config';
import express from 'express';
import { buildStatus } from '@/routes';
import { HomePage } from '@/pages';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get('/', (_req, res) => {
  res.send(HomePage());
});

app.use(
  buildStatus,
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
