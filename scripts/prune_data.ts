import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src/data');

const gamesPath = path.join(dataDir, 'mlb_games.json');
const pitchersPath = path.join(dataDir, 'mlb_pitchers.json');

// Prune games to compact short-key representation
if (fs.existsSync(gamesPath)) {
  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
  const prunedGames = games.map((g: any) => {
    const item: any = {
      pk: g.gamePk ?? g.pk,
      d: g.date ?? g.d,
      h: g.homeAbbr ?? g.h,
      a: g.awayAbbr ?? g.a,
      hs: g.homeScore ?? g.hs,
      as: g.awayScore ?? g.as
    };
    
    const hId = g.homeStarterId ?? g.hi;
    if (hId) item.hi = hId;
    
    const aId = g.awayStarterId ?? g.ai;
    if (aId) item.ai = aId;
    
    return item;
  });
  
  fs.writeFileSync(gamesPath, JSON.stringify(prunedGames), 'utf8');
  console.log(`✓ Games file pruned successfully!`);
  console.log(`  - New size: ${(fs.statSync(gamesPath).size / (1024 * 1024)).toFixed(3)} MB`);
}

// Prune pitchers
if (fs.existsSync(pitchersPath)) {
  const pitchers = JSON.parse(fs.readFileSync(pitchersPath, 'utf8'));
  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
  
  const activeStarters = new Set<number>();
  games.forEach((g: any) => {
    const hId = g.hi;
    const aId = g.ai;
    if (hId) activeStarters.add(hId);
    if (aId) activeStarters.add(aId);
  });

  const prunedPitchers = pitchers
    .filter((p: any) => activeStarters.has(p.id))
    .map((p: any) => {
      return {
        id: p.id,
        season: p.season,
        era: p.era,
        whip: p.whip,
        strikeOuts: p.strikeOuts,
        baseOnBalls: p.baseOnBalls,
        gamesPitched: p.gamesPitched
      };
    });

  fs.writeFileSync(pitchersPath, JSON.stringify(prunedPitchers), 'utf8');
  console.log(`✓ Pitchers file pruned successfully!`);
  console.log(`  - New size: ${(fs.statSync(pitchersPath).size / (1024 * 1024)).toFixed(3)} MB`);
}
