import { execSync } from 'child_process';

const imports = ['numpy', 'lightgbm', 'sklearn', 'joblib', 'json', 'csv', 'urllib', 'sys', 'os'];

for (const imp of imports) {
  try {
    execSync(`python3 -c "import ${imp}"`, { stdio: 'ignore' });
    console.log(`✓ Python import ${imp} SUCCESS`);
  } catch (e) {
    console.log(`❌ Python import ${imp} FAILED`);
  }
}
