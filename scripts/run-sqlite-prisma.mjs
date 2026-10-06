import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {
  ...process.env,
  DATABASE_URL: 'file:./dev.db',
};
delete env.DIRECT_URL;

const result = spawnSync(
  process.execPath,
  [path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js'), ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
