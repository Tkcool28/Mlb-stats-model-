import fs from 'fs';
const games = JSON.parse(fs.readFileSync('./src/data/mlb_games.json', 'utf8'));
const completed = games.filter((g: any) => g.homeScore !== null && g.awayScore !== null);
console.log('Total games in JSON:', games.length);
console.log('Completed games with scores:', completed.length);
