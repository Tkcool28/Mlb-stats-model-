import fs from 'fs';
import path from 'path';

function minifyFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  const beforeStats = fs.statSync(filePath);
  const beforeSizeMB = (beforeStats.size / (1024 * 1024)).toFixed(3);

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse JSON for ${filePath}:`, err);
    return;
  }

  // Stringify as compact JSON
  const minified = JSON.stringify(parsed);
  fs.writeFileSync(filePath, minified, 'utf8');

  const afterStats = fs.statSync(filePath);
  const afterSizeMB = (afterStats.size / (1024 * 1024)).toFixed(3);

  console.log(`Minified ${path.basename(filePath)}:`);
  console.log(`  - Size before: ${beforeSizeMB} MB`);
  console.log(`  - Size after:  ${afterSizeMB} MB`);
}

function main() {
  const dataDir = path.join(process.cwd(), 'src/data');
  minifyFile(path.join(dataDir, 'mlb_games.json'));
  minifyFile(path.join(dataDir, 'mlb_pitchers.json'));
  minifyFile(path.join(dataDir, 'mlb_teams.json'));
}

main();
