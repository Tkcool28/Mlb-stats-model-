import { execSync } from 'child_process';

try {
  console.log('Spawning Python smoke test pipeline...');
  const output = execSync('python3 scripts/smoke_test_stats_model.py', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('❌ Failed running Python smoke test:', error.message || error);
  if (error.stdout) console.log(error.stdout);
  if (error.stderr) console.log(error.stderr);
  process.exit(1);
}
