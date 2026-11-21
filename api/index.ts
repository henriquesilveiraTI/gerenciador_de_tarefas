/**
 * Ponto de entrada na Vercel (função serverless).
 * Reaproveita a mesma aplicação Express usada localmente em src/server.ts;
 * a Vercel encaminha as requisições de /tasks para cá (ver vercel.json).
 * Os arquivos da interface (src/views/public) são servidos pela CDN da Vercel.
 */
import { createApp } from '../src/app';
import { pool } from '../src/config/database';
import { env } from '../src/config/env';

const app = createApp({ db: pool, timeZone: env.timeZone });

export default app;
