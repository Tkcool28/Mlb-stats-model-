import fs from 'fs';

function checkPerms(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} does not exist`);
    return;
  }
  const stats = fs.statSync(filePath);
  console.log(`File: ${filePath}`);
  console.log(`  - Size: ${stats.size} bytes`);
  console.log(`  - UID: ${stats.uid}`);
  console.log(`  - GID: ${stats.gid}`);
  console.log(`  - Mode: ${stats.mode.toString(8)} (octal)`);
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    console.log(`  - Read access: YES`);
  } catch (err) {
    console.log(`  - Read access: NO`);
  }
}

console.log('--- Checking File Permissions ---');
checkPerms('package-lock.json');
checkPerms('src/data/mlb_games.json');
checkPerms('src/data/mlb_pitchers.json');
checkPerms('src/data/mlb_teams.json');
