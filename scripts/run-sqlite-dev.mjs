import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {
  ...process.env,
  DATABASE_URL: 'file:./dev.db',
};
delete env.DIRECT_URL;

const database = spawnSync(
  process.execPath,
  [
    path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js'),
    'db',
    'push',
    '--schema',
    'prisma/schema.sqlite.prisma',
  ],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

if (database.error) {
  throw database.error;
}

if (database.status !== 0) {
  process.exit(database.status ?? 1);
}

const server = spawnSync(
  process.execPath,
  [path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

if (server.error) {
  throw server.error;
}

process.exit(server.status ?? 1);
