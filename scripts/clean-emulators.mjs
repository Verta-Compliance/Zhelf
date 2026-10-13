import { spawnSync } from 'node:child_process';

if (!process.argv.includes('--yes')) {
  console.error(
    'Refusing to delete emulator data without explicit confirmation. Run `npm run emulators:clean -- --yes` to continue.',
  );
  process.exitCode = 2;
} else {
  const result = spawnSync(
    'docker',
    ['compose', 'down', '--volumes', '--remove-orphans'],
    { stdio: 'inherit' },
  );

  if (result.error) {
    console.error(`Unable to run Docker Compose: ${result.error.message}`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
