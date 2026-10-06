import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {
  ...process.env,
  DATABASE_URL: 'file:./dev.db',
};
delete env.DIRECT_URL;

const prisma = spawnSync(
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

if (prisma.error) {
  throw prisma.error;
}

if (prisma.status !== 0) {
  process.exit(prisma.status ?? 1);
}

const tests = spawnSync(
  process.execPath,
  [
    path.join(projectRoot, 'node_modules', 'jest', 'bin', 'jest.js'),
    '--runInBand',
    ...process.argv.slice(2),
  ],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

if (tests.error) {
  throw tests.error;
}

process.exit(tests.status ?? 1);
