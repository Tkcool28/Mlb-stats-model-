import { spawn } from 'child_process';

console.log('Starting Python training script: scripts/train_baseline_lgbm.py...\n');

const pyProcess = spawn('python3', ['scripts/train_baseline_lgbm.py']);

pyProcess.stdout.on('data', (data) => {
  process.stdout.write(data.toString());
});

pyProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

pyProcess.on('close', (code) => {
  console.log(`\nPython process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code || 1);
  }
});
