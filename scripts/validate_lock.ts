import fs from 'fs';
try {
  const content = fs.readFileSync('package-lock.json', 'utf8');
  JSON.parse(content);
  console.log('✓ package-lock.json is valid JSON');
} catch (err: any) {
  console.error('❌ package-lock.json is invalid JSON:', err.message || err);
}
