import fs from 'fs';
import path from 'path';

function validateFile(filePath: string, name: string): any[] {
  console.log(`Checking ${name}...`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`LOUD FAIL: File ${name} does not exist at ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error(`LOUD FAIL: File ${name} is empty (0 bytes)`);
  }

  let data: any;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err: any) {
    throw new Error(`LOUD FAIL: File ${name} is not valid JSON. Error: ${err.message || err}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`LOUD FAIL: File ${name} top-level structure must be an array`);
  }

  if (data.length === 0) {
    throw new Error(`LOUD FAIL: File ${name} has 0 records`);
  }

  console.log(`✓ ${name} parsed successfully (${data.length} records)`);
  return data;
}

function main() {
  console.log('==================================================');
  console.log('🔍 RUNNING DATA VALIDATION CHECK');
  console.log('==================================================');

  try {
    const dataDir = path.join(process.cwd(), 'src/data');

    // Load games supporting split-season structures or fallback
    let rawGames: any[] = [];
    const splitFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('mlb_games_') && f.endsWith('.json'));
    
    if (splitFiles.length > 0) {
      console.log(`Checking and merging ${splitFiles.length} split seasons...`);
      splitFiles.sort().forEach((file) => {
        const fileContent = validateFile(path.join(dataDir, file), file);
        rawGames = rawGames.concat(fileContent);
      });
    } else {
      rawGames = validateFile(path.join(dataDir, 'mlb_games.json'), 'mlb_games.json');
    }

    const games = rawGames.map((g: any) => {
      if (g.pk !== undefined) {
        return {
          gamePk: g.pk,
          season: g.d ? g.d.substring(0, 4) : g.season,
          date: g.d,
          homeTeam: g.ht || 'Home Team',
          homeId: g.hid || 0,
          homeAbbr: g.h,
          homeScore: g.hs,
          awayTeam: g.at || 'Away Team',
          awayId: g.aid || 0,
          awayAbbr: g.a,
          awayScore: g.as,
          homeStarterId: g.hi ?? null,
          homeStarterName: g.hn ?? null,
          awayStarterId: g.ai ?? null,
          awayStarterName: g.an ?? null
        };
      }
      return g;
    });

    const teams = validateFile(path.join(dataDir, 'mlb_teams.json'), 'mlb_teams.json');

    const rawPitchers = validateFile(path.join(dataDir, 'mlb_pitchers.json'), 'mlb_pitchers.json');
    const pitchers = rawPitchers.map((p: any) => {
      return {
        id: p.id,
        name: p.name || `Pitcher ${p.id}`,
        teamId: p.teamId || 0,
        teamAbbr: p.teamAbbr || 'UNK',
        season: p.season,
        pitchHand: p.pitchHand || 'R',
        era: p.era,
        whip: p.whip,
        gamesStarted: p.gamesStarted !== undefined ? p.gamesStarted : (p.gamesPitched || 0),
        gamesPitched: p.gamesPitched || 0,
        inningsPitched: p.inningsPitched || '0.0',
        strikeOuts: p.strikeOuts,
        baseOnBalls: p.baseOnBalls
      };
    });

    // Check seasons
    const gamesSeasons = new Set<string>();
    games.forEach((g: any) => {
      const s = g.season || (g.date ? g.date.substring(0, 4) : null);
      if (s) gamesSeasons.add(s.toString());
    });

    console.log(`Checking game seasons: ${Array.from(gamesSeasons).sort().join(', ')}`);
    for (let yr = 2010; yr <= 2025; yr++) {
      if (!gamesSeasons.has(yr.toString())) {
        throw new Error(`LOUD FAIL: Games file is missing expected season ${yr}`);
      }
    }
    console.log('✓ All expected seasons 2010-2025 are present in games file!');

    // Check pitcher records
    const pitcherSeasons = new Set<string>();
    pitchers.forEach((p: any) => {
      if (p.season) pitcherSeasons.add(p.season.toString());
    });
    console.log(`Pitcher data spans seasons: ${Array.from(pitcherSeasons).sort().join(', ')}`);

    const helpfulPitchers = pitchers.filter((p: any) => p.gamesStarted > 0 || p.gamesPitched > 0);
    if (helpfulPitchers.length === 0) {
      throw new Error('LOUD FAIL: No pitchers with gamesStarted or gamesPitched values exist');
    }
    console.log(`✓ Pitcher records validated (${helpfulPitchers.length} usable pitcher-season profiles)`);

    console.log('\n🎉 ALL DATA VALIDATION CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ VALIDATION ERROR OCCURRED:\n');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
