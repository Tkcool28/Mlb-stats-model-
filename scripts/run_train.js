import { execSync } from 'child_process';

try {
  console.log('Spawning Python training pipeline directly to fit LightGBM stats-only moneyline... (2010-2025)');
  const output = execSync('python3 scripts/train_baseline_lgbm.py', { encoding: 'utf8' });
  console.log('--- Python Outputs ---');
  console.log(output);
} catch (error) {
  console.error('❌ Failed running Python training script:', error.message || error);
  if (error.stdout) {
    console.log('--- Python Standard Output ---');
    console.log(error.stdout);
  }
  if (error.stderr) {
    console.log('--- Python Standard Error ---');
    console.log(error.stderr);
  }
  process.exit(1);
}
