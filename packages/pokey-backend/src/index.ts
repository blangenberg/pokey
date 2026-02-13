import express from 'express';
import { createRouter } from './routes/index';
import { createDependencies } from './utils/handler-dependency-util';

const PORT = Number(process.env['PORT'] ?? '3001');

const app = express();
app.use(express.json());

const deps = createDependencies();
const router = createRouter(deps);

app.use('/api', router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Pokey backend listening on http://localhost:${String(PORT)}`);
});
