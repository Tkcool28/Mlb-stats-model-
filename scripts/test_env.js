import { execSync } from 'child_process';

try {
  console.log('Running build_pitcher_features.py...');
  const output = execSync('python3 scripts/build_pitcher_features.py', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('Test env error:', error.message || error);
}

