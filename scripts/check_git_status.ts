import { execSync } from 'child_process';

try {
  const status = execSync('git status', { encoding: 'utf8' });
  console.log('--- GIT STATUS ---');
  console.log(status);
} catch (err: any) {
  console.error('Failed to run git status:', err.message || err);
}
