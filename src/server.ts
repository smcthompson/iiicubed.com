// Entry point for the application server.
import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get('/', (_req, res) => {
});

app.use(
);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
