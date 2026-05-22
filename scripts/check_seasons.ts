import fs from 'fs';

const games = JSON.parse(fs.readFileSync('./src/data/mlb_games.json', 'utf8'));
const seasonsMap: Record<string, number> = {};

games.forEach((g: any) => {
  const date = g.date || g.d;
  const season = g.season || (date ? date.substring(0, 4) : 'unknown');
  seasonsMap[season] = (seasonsMap[season] || 0) + 1;
});

const result = {
  seasonsMap,
  totalGames: games.length
};

fs.writeFileSync('./scripts/seasons_outcome.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Done checking seasons!');
