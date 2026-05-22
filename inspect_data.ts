import fs from 'fs';

const games = JSON.parse(fs.readFileSync('./src/data/mlb_games.json', 'utf8'));

// Let's compute team-season aggregates from games
const teamSeasonStats: Record<string, { runsScored: number; runsAllowed: number; gamesPlayed: number; wins: number }> = {};

for (const g of games) {
  if (g.homeScore === null || g.awayScore === null) continue;
  
  const season = g.season;
  const home = g.homeAbbr;
  const away = g.awayAbbr;
  
  const homeKey = `${season}_${home}`;
  const awayKey = `${season}_${away}`;
  
  if (!teamSeasonStats[homeKey]) teamSeasonStats[homeKey] = { runsScored: 0, runsAllowed: 0, gamesPlayed: 0, wins: 0 };
  if (!teamSeasonStats[awayKey]) teamSeasonStats[awayKey] = { runsScored: 0, runsAllowed: 0, gamesPlayed: 0, wins: 0 };
  
  teamSeasonStats[homeKey].runsScored += g.homeScore;
  teamSeasonStats[homeKey].runsAllowed += g.awayScore;
  teamSeasonStats[homeKey].gamesPlayed += 1;
  if (g.homeScore > g.awayScore) teamSeasonStats[homeKey].wins += 1;
  
  teamSeasonStats[awayKey].runsScored += g.awayScore;
  teamSeasonStats[awayKey].runsAllowed += g.homeScore;
  teamSeasonStats[awayKey].gamesPlayed += 1;
  if (g.awayScore > g.homeScore) teamSeasonStats[awayKey].wins += 1;
}

console.log('Number of team-seasons aggregated:', Object.keys(teamSeasonStats).length);
const sampleKey = '2014_ANA';
console.log(`Aggregate for ${sampleKey}:`, teamSeasonStats[sampleKey]);
if (teamSeasonStats[sampleKey]) {
  const gCount = teamSeasonStats[sampleKey].gamesPlayed;
  console.log('Runs scored pg:', teamSeasonStats[sampleKey].runsScored / gCount);
  console.log('Runs allowed pg:', teamSeasonStats[sampleKey].runsAllowed / gCount);
  console.log('Win percentage:', teamSeasonStats[sampleKey].wins / gCount);
}
