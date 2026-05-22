import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'src/data');
const gamesPath = path.join(dataDir, 'mlb_games.json');

if (fs.existsSync(gamesPath)) {
  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
  const prunedGames = games.map((g: any) => {
    return {
      gamePk: g.gamePk,
      season: g.season,
      date: g.date,
      homeAbbr: g.homeAbbr,
      awayAbbr: g.awayAbbr,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeStarterId: g.homeStarterId,
      awayStarterId: g.awayStarterId
    };
  });
  
  const tempPath = path.join(dataDir, 'mlb_games_temp.json');
  fs.writeFileSync(tempPath, JSON.stringify(prunedGames), 'utf8');
  console.log(`With no pitcher names, games size: ${(fs.statSync(tempPath).size / (1024 * 1024)).toFixed(3)} MB`);
  fs.unlinkSync(tempPath);
}
