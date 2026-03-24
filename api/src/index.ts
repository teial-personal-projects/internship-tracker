import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createApp } from './app';

const version = readFileSync(resolve(__dirname, '../../version.txt'), 'utf-8').trim();
const port = Number(process.env.PORT) || 8080;
const app = createApp(version);

app.listen(port, () => {
  console.log(`API v${version} running on http://localhost:${port}`);
});
