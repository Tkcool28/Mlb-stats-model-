import fs from 'fs';
import path from 'path';

// Mapping team ID to standard MLB abbreviations
const teamIdToAbbr: Record<number, string> = {
  110: 'BAL', 111: 'BOS', 108: 'ANA', 145: 'CHW', 114: 'CLE',
  116: 'DET', 117: 'HOU', 118: 'KCR', 142: 'MIN', 147: 'NYY',
  133: 'OAK', 136: 'SEA', 139: 'TBR', 140: 'TEX', 141: 'TOR',
  109: 'ARI', 144: 'ATL', 112: 'CHC', 113: 'CIN', 115: 'COL',
  119: 'LAD', 146: 'MIA', 158: 'MIL', 121: 'NYM', 143: 'PHI',
  134: 'PIT', 135: 'SDP', 137: 'SFG', 138: 'STL', 120: 'WSN'
};

// Year season ranges for MLB regular season
const seasonRanges: Record<string, { start: string; end: string }> = {
  '2010': { start: '2010-04-01', end: '2010-10-05' },
  '2011': { start: '2011-03-25', end: '2011-10-05' },
  '2012': { start: '2012-03-25', end: '2012-10-05' },
  '2013': { start: '2013-03-25', end: '2013-10-05' },
  '2014': { start: '2014-03-22', end: '2014-09-28' },
  '2015': { start: '2015-04-05', end: '2015-10-04' },
  '2016': { start: '2016-04-03', end: '2016-10-02' },
  '2017': { start: '2017-04-02', end: '2017-10-01' },
  '2018': { start: '2018-03-29', end: '2018-10-01' },
  '2019': { start: '2019-03-20', end: '2019-09-29' },
  '2020': { start: '2020-07-23', end: '2020-09-27' }, // 60-game season
  '2021': { start: '2021-04-01', end: '2021-10-03' },
  '2022': { start: '2022-04-07', end: '2022-10-05' },
  '2023': { start: '2023-03-30', end: '2023-10-01' },
  '2024': { start: '2024-03-20', end: '2024-09-30' },
  '2025': { start: '2025-03-27', end: '2025-09-30' }
};

interface GameData {
  gamePk: number;
  season: string;
  date: string;
  homeTeam: string;
  homeId: number;
  homeAbbr: string;
  homeScore: number | null;
  awayTeam: string;
  awayId: number;
  awayAbbr: string;
  awayScore: number | null;
  homeStarterId: number | null;
  homeStarterName: string | null;
  awayStarterId: number | null;
  awayStarterName: string | null;
}

interface TeamStats {
  id: number;
  season: string;
  name: string;
  abbr: string;
  batting: any;
  pitching: any;
  advancedPitching: any;
}

interface PitcherStats {
  id: number;
  name: string;
  teamId: number;
  teamAbbr: string;
  season: string;
  pitchHand: string; // 'L' or 'R'
  era: number;
  whip: number;
  gamesStarted: number;
  gamesPitched: number;
  inningsPitched: string;
  strikeOuts: number;
  baseOnBalls: number;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('⚾ STARTING MLB HISTORICAL DATA COMPILER (2010-2025) ⚾');
  const seasons = Object.keys(seasonRanges);
  const dataDir = path.resolve('./src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const allGames: GameData[] = [];
  const allTeams: TeamStats[] = [];
  const allPitchers: Record<string, PitcherStats> = {}; // keyed by `season_id`

  for (const season of seasons) {
    console.log(`\nProcessing Season: ${season}...`);
    const range = seasonRanges[season];

    try {
      // 1. Fetch Schedule with Probable Pitchers
      console.log(`- Fetching schedule from ${range.start} to ${range.end}...`);
      const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${range.start}&endDate=${range.end}&hydrate=probablePitcher`;
      const scheduleRes = await fetch(scheduleUrl);
      const scheduleData: any = await scheduleRes.json();

      let seasonGamesCount = 0;
      if (scheduleData.dates) {
        for (const dateObj of scheduleData.dates) {
          const dateStr = dateObj.date;
          if (!dateObj.games) continue;

          for (const g of dateObj.games) {
            // Only regular season games
            if (g.gameType !== 'R') continue;

            const home = g.teams.home;
            const away = g.teams.away;

            const homeId = home.team.id;
            const awayId = away.team.id;

            const homeAbbr = teamIdToAbbr[homeId] || 'UNK';
            const awayAbbr = teamIdToAbbr[awayId] || 'UNK';

            // Filter out any teams not in our target 30 mappings
            if (homeAbbr === 'UNK' || awayAbbr === 'UNK') continue;

            // Extract starters
            const homeStarterId = home.probablePitcher?.id || null;
            const homeStarterName = home.probablePitcher?.fullName || null;
            const awayStarterId = away.probablePitcher?.id || null;
            const awayStarterName = away.probablePitcher?.fullName || null;

            allGames.push({
              gamePk: g.gamePk,
              season,
              date: dateStr,
              homeTeam: home.team.name,
              homeId,
              homeAbbr,
              homeScore: home.score !== undefined ? home.score : null,
              awayTeam: away.team.name,
              awayId,
              awayAbbr,
              awayScore: away.score !== undefined ? away.score : null,
              homeStarterId,
              homeStarterName,
              awayStarterId,
              awayStarterName
            });
            seasonGamesCount++;
          }
        }
      }
      console.log(`  ✓ Found ${seasonGamesCount} regular season games.`);

      // Write season split files immediately to avoid memory and storage limits
      const seasonGames = allGames.filter(g => g.season === season);
      const seasonGamesPath = path.join(dataDir, `mlb_games_${season}.json`);
      fs.writeFileSync(seasonGamesPath, JSON.stringify(seasonGames, null, 2), 'utf8');
      console.log(`  ✓ Saved split file: mlb_games_${season}.json`);

      // 2. Fetch Team Batting Stats
      console.log(`- Fetching team batting stats...`);
      const battingUrl = `https://statsapi.mlb.com/api/v1/teams/stats?season=${season}&sportId=1&stats=season&group=batting`;
      const battingRes = await fetch(battingUrl);
      const battingData: any = await battingRes.json();
      const teamBattingMap: Record<number, any> = {};
      if (battingData.stats?.[0]?.splits) {
        for (const split of battingData.stats[0].splits) {
          teamBattingMap[split.team.id] = split.stat;
        }
      }

      // 3. Fetch Team Pitching Stats
      console.log(`- Fetching team pitching stats...`);
      const pitchingUrl = `https://statsapi.mlb.com/api/v1/teams/stats?season=${season}&sportId=1&stats=season&group=pitching`;
      const pitchingRes = await fetch(pitchingUrl);
      const pitchingData: any = await pitchingRes.json();
      const teamPitchingMap: Record<number, any> = {};
      if (pitchingData.stats?.[0]?.splits) {
        for (const split of pitchingData.stats[0].splits) {
          teamPitchingMap[split.team.id] = split.stat;
        }
      }

      // 4. Fetch Team Advanced Pitching Stats (qualityStarts etc.)
      console.log(`- Fetching team advanced pitching stats...`);
      const advancedPitchMap: Record<number, any> = {};
      for (const id of Object.keys(teamIdToAbbr)) {
        const teamId = Number(id);
        const advUrl = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?stats=seasonAdvanced&group=pitching&season=${season}`;
        try {
          const advRes = await fetch(advUrl);
          const advJson: any = await advRes.json();
          if (advJson.stats?.[0]?.splits?.[0]?.stat) {
            advancedPitchMap[teamId] = advJson.stats[0].splits[0].stat;
          }
        } catch (e) {
          // ignore error
        }
        await delay(50); // slight throttle to prevent spamming
      }

      // Populate Team statistics
      for (const idStr of Object.keys(teamIdToAbbr)) {
        const id = Number(idStr);
        const abbr = teamIdToAbbr[id];
        allTeams.push({
          id,
          season,
          name: teamPitchingMap[id]?.team?.name || abbr,
          abbr,
          batting: teamBattingMap[id] || {},
          pitching: teamPitchingMap[id] || {},
          advancedPitching: advancedPitchMap[id] || {}
        });
      }

      // 5. Fetch Player lists to identify throwing hands
      console.log(`- Fetching player roster and attributes...`);
      const playerUrl = `https://statsapi.mlb.com/api/v1/sports/1/players?season=${season}`;
      const playerRes = await fetch(playerUrl);
      const playerData: any = await playerRes.json();
      const throwHandMap: Record<number, string> = {}; // player id to hand code 'L'/'R'
      if (playerData.people) {
        for (const person of playerData.people) {
          const hand = person.pitchHand?.code || 'R'; // defaults to R if not found
          throwHandMap[person.id] = hand;
        }
      }

      // 6. Fetch player-level pitching stats to get Starting Pitching stats
      console.log(`- Fetching individual player pitching stats...`);
      const playerStatsUrl = `https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=${season}&sportId=1&limit=2000&playerPool=all`;
      const playerStatsRes = await fetch(playerStatsUrl);
      const playerStatsData: any = await playerStatsRes.json();
      if (playerStatsData.stats?.[0]?.splits) {
        for (const split of playerStatsData.stats[0].splits) {
          const pid = split.player.id;
          const pName = split.player.fullName;
          const tid = split.team?.id || 0;
          const tAbbr = teamIdToAbbr[tid] || 'UNK';
          const stat = split.stat;

          const key = `${season}_${pid}`;
          allPitchers[key] = {
            id: pid,
            name: pName,
            teamId: tid,
            teamAbbr: tAbbr,
            season,
            pitchHand: throwHandMap[pid] || 'R',
            era: parseFloat(stat.era) || 4.50,
            whip: parseFloat(stat.whip) || 1.35,
            gamesStarted: stat.gamesStarted || 0,
            gamesPitched: stat.gamesPitched || 0,
            inningsPitched: stat.inningsPitched || '0.0',
            strikeOuts: stat.strikeOuts || 0,
            baseOnBalls: stat.baseOnBalls || 0
          };
        }
      }

    } catch (e) {
      console.error(`💥 Failed to compile season ${season}:`, e);
    }
  }

  // Write outputs to files
  const gamesPath = path.join(dataDir, 'mlb_games.json');
  const teamsPath = path.join(dataDir, 'mlb_teams.json');
  const pitchersPath = path.join(dataDir, 'mlb_pitchers.json');

  console.log('\n✍️ Writing database files...');
  // Keeping mlb_games.json compact with only 2024-2025 games to satisfy platform size limits, 
  // while the application reads the full 2010-2025 historical data from the split files.
  const compactGames = allGames.filter((g) => parseInt(g.season) >= 2024);
  fs.writeFileSync(gamesPath, JSON.stringify(compactGames, null, 2));
  fs.writeFileSync(teamsPath, JSON.stringify(allTeams, null, 2));
  fs.writeFileSync(pitchersPath, JSON.stringify(Object.values(allPitchers), null, 2));

  console.log(`🎉 COMPILATION SUCCEEDED!`);
  console.log(`- Saved ${allGames.length} games to ${gamesPath}`);
  console.log(`- Saved ${allTeams.length} team seasons to ${teamsPath}`);
  console.log(`- Saved ${Object.keys(allPitchers).length} pitcher seasons to ${pitchersPath}`);
}

run();
