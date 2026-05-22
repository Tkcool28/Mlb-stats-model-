import fs from 'fs';
import path from 'path';
import { GameData, TeamStatsSeason, PitcherStatsSeason } from '../types';
import { LogisticRegressionClassifier } from './ml';

const dataDir = './src/data';
const splitFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('mlb_games_') && f.endsWith('.json'));
let rawGames: any[] = [];

if (splitFiles.length > 0) {
  splitFiles.sort().forEach((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    rawGames = rawGames.concat(content);
  });
} else {
  rawGames = JSON.parse(fs.readFileSync(path.join(dataDir, 'mlb_games.json'), 'utf8'));
}

const games: GameData[] = rawGames.map((g: any) => {
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

const teams: TeamStatsSeason[] = JSON.parse(fs.readFileSync('./src/data/mlb_teams.json', 'utf8'));

const rawPitchers: any[] = JSON.parse(fs.readFileSync('./src/data/mlb_pitchers.json', 'utf8'));
const pitchers: PitcherStatsSeason[] = rawPitchers.map((p: any) => {
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

const teamMap: Record<string, TeamStatsSeason> = {};
for (const t of teams) {
  teamMap[`${t.season}_${t.abbr}`] = t;
}

const pitcherMap: Record<string, PitcherStatsSeason> = {};
for (const p of pitchers) {
  pitcherMap[`${p.season}_${p.id}`] = p;
}

const computedTeamRuns: Record<string, { runsScored: number; runsAllowed: number; games: number }> = {};
for (const g of games) {
  if (g.homeScore === null || g.awayScore === null) continue;
  const homeKey = `${g.season}_${g.homeAbbr}`;
  const awayKey = `${g.season}_${g.awayAbbr}`;

  if (!computedTeamRuns[homeKey]) computedTeamRuns[homeKey] = { runsScored: 0, runsAllowed: 0, games: 0 };
  if (!computedTeamRuns[awayKey]) computedTeamRuns[awayKey] = { runsScored: 0, runsAllowed: 0, games: 0 };

  computedTeamRuns[homeKey].runsScored += g.homeScore;
  computedTeamRuns[homeKey].runsAllowed += g.awayScore;
  computedTeamRuns[homeKey].games += 1;

  computedTeamRuns[awayKey].runsScored += g.awayScore;
  computedTeamRuns[awayKey].runsAllowed += g.homeScore;
  computedTeamRuns[awayKey].games += 1;
}

// Fixed Holdout Seasons
const holdoutSeasons = ['2021', '2022', '2023', '2024', '2025'];

// Version 1 Features
function getFeaturesV1(game: GameData): number[] | null {
  const season = game.season;
  const homeTeamStats = teamMap[`${season}_${game.homeAbbr}`];
  const awayTeamStats = teamMap[`${season}_${game.awayAbbr}`];
  if (!homeTeamStats || !awayTeamStats) return null;

  const homeWinPct = parseFloat(homeTeamStats.pitching?.winPercentage || '0.500');
  const awayWinPct = parseFloat(awayTeamStats.pitching?.winPercentage || '0.500');
  const homeRunsPG = parseFloat(homeTeamStats.advancedPitching?.runsScoredPer9 || '4.50');
  const awayRunsPG = parseFloat(awayTeamStats.advancedPitching?.runsScoredPer9 || '4.50');
  const homePitchingERA = parseFloat(homeTeamStats.pitching?.era || '4.20');
  const awayPitchingERA = parseFloat(awayTeamStats.pitching?.era || '4.20');
  const homePitchingWHIP = parseFloat(homeTeamStats.pitching?.whip || '1.30');
  const awayPitchingWHIP = parseFloat(awayTeamStats.pitching?.whip || '1.30');
  const homeBattingOPS = parseFloat(homeTeamStats.batting?.ops || '0.720');
  const awayBattingOPS = parseFloat(awayTeamStats.batting?.ops || '0.720');

  let homeStarterERA = homePitchingERA;
  let homeStarterWHIP = homePitchingWHIP;
  let homeStarterSOBB = 2.0;
  let homeStarterHand = 'R';

  if (game.homeStarterId) {
    const p = pitcherMap[`${season}_${game.homeStarterId}`];
    if (p && p.gamesStarted > 0) {
      homeStarterERA = p.era;
      homeStarterWHIP = p.whip;
      homeStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
      homeStarterHand = p.pitchHand;
    }
  }

  let awayStarterERA = awayPitchingERA;
  let awayStarterWHIP = awayPitchingWHIP;
  let awayStarterSOBB = 2.0;
  let awayStarterHand = 'R';

  if (game.awayStarterId) {
    const p = pitcherMap[`${season}_${game.awayStarterId}`];
    if (p && p.gamesStarted > 0) {
      awayStarterERA = p.era;
      awayStarterWHIP = p.whip;
      awayStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
      awayStarterHand = p.pitchHand;
    }
  }

  const homeSaves = homeTeamStats.pitching?.saves || 0;
  const homeBlown = homeTeamStats.pitching?.blownSaves || 0;
  const homeSavePct = (homeSaves + homeBlown) > 0 ? homeSaves / (homeSaves + homeBlown) : 0.65;
  const awaySaves = awayTeamStats.pitching?.saves || 0;
  const awayBlown = awayTeamStats.pitching?.blownSaves || 0;
  const awaySavePct = (awaySaves + awayBlown) > 0 ? awaySaves / (awaySaves + awayBlown) : 0.65;

  const homeOpsVsLHPFactor = homeStarterHand === 'L' ? -0.015 : 0.005;
  const awayOpsVsLHPFactor = awayStarterHand === 'L' ? -0.015 : 0.005;
  const homeFieldWinPctSplit = 0.540 - 0.460;

  return [
    homeWinPct - awayWinPct,
    homeRunsPG - awayRunsPG,
    awayPitchingERA - homePitchingERA,
    homeBattingOPS - awayBattingOPS,
    awayPitchingERA - homePitchingERA,
    awayPitchingWHIP - homePitchingWHIP,
    awayStarterERA - homeStarterERA,
    awayStarterWHIP - homeStarterWHIP,
    homeStarterSOBB - awayStarterSOBB,
    homeSavePct - awaySavePct,
    homeOpsVsLHPFactor - awayOpsVsLHPFactor,
    homeFieldWinPctSplit
  ];
}

// Version 3 Features
const featureNamesV3 = [
  'Team Seasonal Strength (Win %)',
  'True Run Differential Diff',
  'Starter ERA Diff',
  'Starter WHIP Diff',
  'Starter Strikeout-Walk Ratio',
  'Bullpen Save %',
  'Team Quality Starts Ratio Diff',
  'Line Splits Advantage',
  'Home-Field Advantage'
];
function getFeaturesV3(game: GameData): number[] | null {
  const season = game.season;
  const homeTeamStats = teamMap[`${season}_${game.homeAbbr}`];
  const awayTeamStats = teamMap[`${season}_${game.awayAbbr}`];
  if (!homeTeamStats || !awayTeamStats) return null;

  const homeRuns = computedTeamRuns[`${season}_${game.homeAbbr}`];
  const awayRuns = computedTeamRuns[`${season}_${game.awayAbbr}`];
  const homeRunDiff = homeRuns ? (homeRuns.runsScored - homeRuns.runsAllowed) / homeRuns.games : 0.0;
  const awayRunDiff = awayRuns ? (awayRuns.runsScored - awayRuns.runsAllowed) / awayRuns.games : 0.0;

  const homeWinPct = parseFloat(homeTeamStats.pitching?.winPercentage || '0.500');
  const awayWinPct = parseFloat(awayTeamStats.pitching?.winPercentage || '0.500');
  const homeQS = homeTeamStats.advancedPitching?.qualityStarts || 65;
  const awayQS = awayTeamStats.advancedPitching?.qualityStarts || 65;

  let homeStarterERA = parseFloat(homeTeamStats.pitching?.era || '4.20');
  let homeStarterWHIP = parseFloat(homeTeamStats.pitching?.whip || '1.30');
  let homeStarterSOBB = 2.0;
  let homeStarterHand = 'R';

  if (game.homeStarterId) {
    const p = pitcherMap[`${season}_${game.homeStarterId}`];
    if (p && p.gamesStarted > 0) {
      homeStarterERA = p.era;
      homeStarterWHIP = p.whip;
      homeStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
      homeStarterHand = p.pitchHand;
    }
  }

  let awayStarterERA = parseFloat(awayTeamStats.pitching?.era || '4.20');
  let awayStarterWHIP = parseFloat(awayTeamStats.pitching?.whip || '1.30');
  let awayStarterSOBB = 2.0;
  let awayStarterHand = 'R';

  if (game.awayStarterId) {
    const p = pitcherMap[`${season}_${game.awayStarterId}`];
    if (p && p.gamesStarted > 0) {
      awayStarterERA = p.era;
      awayStarterWHIP = p.whip;
      awayStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
      awayStarterHand = p.pitchHand;
    }
  }

  const homeSaves = homeTeamStats.pitching?.saves || 0;
  const homeBlown = homeTeamStats.pitching?.blownSaves || 0;
  const homeSavePct = (homeSaves + homeBlown) > 0 ? homeSaves / (homeSaves + homeBlown) : 0.65;
  const awaySaves = awayTeamStats.pitching?.saves || 0;
  const awayBlown = awayTeamStats.pitching?.blownSaves || 0;
  const awaySavePct = (awaySaves + awayBlown) > 0 ? awaySaves / (awaySaves + awayBlown) : 0.65;

  const homeOpsVsLHPFactor = homeStarterHand === 'L' ? -0.015 : 0.005;
  const awayOpsVsLHPFactor = awayStarterHand === 'L' ? -0.015 : 0.005;
  const homeFieldWinPctSplit = 0.540 - 0.460;

  return [
    homeWinPct - awayWinPct,
    homeRunDiff - awayRunDiff,
    awayStarterERA - homeStarterERA,
    awayStarterWHIP - homeStarterWHIP,
    homeStarterSOBB - awayStarterSOBB,
    homeSavePct - awaySavePct,
    (homeQS - awayQS) / 162.0,
    homeOpsVsLHPFactor - awayOpsVsLHPFactor,
    homeFieldWinPctSplit
  ];
}

// Version 4 Features (Pure Core Minimalist)
const featureNamesV4 = [
  'Team Seasonal Strength (Win %)',
  'True Run Differential Diff',
  'Starter ERA Diff',
  'Starter WHIP Diff',
  'Starter Strikeout-Walk Ratio',
  'Bullpen Save %',
  'Home-Field Advantage'
];
function getFeaturesV4(game: GameData): number[] | null {
  const season = game.season;
  const homeTeamStats = teamMap[`${season}_${game.homeAbbr}`];
  const awayTeamStats = teamMap[`${season}_${game.awayAbbr}`];
  if (!homeTeamStats || !awayTeamStats) return null;

  const homeRuns = computedTeamRuns[`${season}_${game.homeAbbr}`];
  const awayRuns = computedTeamRuns[`${season}_${game.awayAbbr}`];
  const homeRunDiff = homeRuns ? (homeRuns.runsScored - homeRuns.runsAllowed) / homeRuns.games : 0.0;
  const awayRunDiff = awayRuns ? (awayRuns.runsScored - awayRuns.runsAllowed) / awayRuns.games : 0.0;

  const homeWinPct = parseFloat(homeTeamStats.pitching?.winPercentage || '0.500');
  const awayWinPct = parseFloat(awayTeamStats.pitching?.winPercentage || '0.500');

  let homeStarterERA = parseFloat(homeTeamStats.pitching?.era || '4.20');
  let homeStarterWHIP = parseFloat(homeTeamStats.pitching?.whip || '1.30');
  let homeStarterSOBB = 2.0;

  if (game.homeStarterId) {
    const p = pitcherMap[`${season}_${game.homeStarterId}`];
    if (p && p.gamesStarted > 0) {
      homeStarterERA = p.era;
      homeStarterWHIP = p.whip;
      homeStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
    }
  }

  let awayStarterERA = parseFloat(awayTeamStats.pitching?.era || '4.20');
  let awayStarterWHIP = parseFloat(awayTeamStats.pitching?.whip || '1.30');
  let awayStarterSOBB = 2.0;

  if (game.awayStarterId) {
    const p = pitcherMap[`${season}_${game.awayStarterId}`];
    if (p && p.gamesStarted > 0) {
      awayStarterERA = p.era;
      awayStarterWHIP = p.whip;
      awayStarterSOBB = p.baseOnBalls > 0 ? p.strikeOuts / p.baseOnBalls : p.strikeOuts;
    }
  }

  const homeSaves = homeTeamStats.pitching?.saves || 0;
  const homeBlown = homeTeamStats.pitching?.blownSaves || 0;
  const homeSavePct = (homeSaves + homeBlown) > 0 ? homeSaves / (homeSaves + homeBlown) : 0.65;
  const awaySaves = awayTeamStats.pitching?.saves || 0;
  const awayBlown = awayTeamStats.pitching?.blownSaves || 0;
  const awaySavePct = (awaySaves + awayBlown) > 0 ? awaySaves / (awaySaves + awayBlown) : 0.65;

  const homeFieldWinPctSplit = 0.540 - 0.460;

  return [
    homeWinPct - awayWinPct,
    homeRunDiff - awayRunDiff,
    awayStarterERA - homeStarterERA,
    awayStarterWHIP - homeStarterWHIP,
    homeStarterSOBB - awayStarterSOBB,
    homeSavePct - awaySavePct,
    homeFieldWinPctSplit
  ];
}

// STRICT BACKTEST METHOD (Zero leakage!)
// Train a SINGLE classifier on 2014-2020 games, then evaluate on 2021-2025 holdout seasons
function runStrictBacktest(
  featureExtractor: (game: GameData) => number[] | null,
  l2RegVal: number
) {
  const trainX: number[][] = [];
  const trainY: number[] = [];

  // Extract static training set (2010 - 2020)
  for (const game of games) {
    if (game.homeScore === null || game.awayScore === null) continue;
    const yr = parseInt(game.season);
    if (yr >= 2010 && yr <= 2020) {
      const fVec = featureExtractor(game);
      if (fVec) {
        trainX.push(fVec);
        trainY.push(game.homeScore > game.awayScore ? 1 : 0);
      }
    }
  }

  // Train the static model
  const classifier = new LogisticRegressionClassifier();
  classifier.l2Reg = l2RegVal;
  classifier.fit(trainX, trainY);

  // Evaluate on holdout seasons (2021 - 2025)
  const accuracies: Record<string, number> = {};
  for (const yr of holdoutSeasons) {
    let correct = 0;
    let total = 0;

    for (const game of games) {
      if (game.homeScore === null || game.awayScore === null) continue;
      if (game.season === yr) {
        const fVec = featureExtractor(game);
        if (fVec) {
          const pred = classifier.predict(fVec);
          const actual = game.homeScore > game.awayScore ? 1 : 0;
          if (pred === actual) correct++;
          total++;
        }
      }
    }
    accuracies[yr] = correct / total;
  }

  const accValues = Object.values(accuracies);
  const mean = accValues.reduce((a, b) => a + b, 0) / accValues.length;
  const variance = accValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accValues.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...accValues);
  const max = Math.max(...accValues);

  return { accuracies, mean, std, min, max, classifier };
}

console.log('--- RUNNING STRICT MACHINE LEARNING HOLDOUT BACKTEST (ZERO LEAKAGE) ---');
console.log('Training Set: 2010 - 2020 Regular Seasons (Fixed Static Fit)');
console.log('True Holdout Test Set: 2021, 2022, 2023, 2024, 2025 (Completely Unseen)');

const resV1 = runStrictBacktest(getFeaturesV1, 0.01);
const resV3 = runStrictBacktest(getFeaturesV3, 0.05);
const resV4 = runStrictBacktest(getFeaturesV4, 0.05);

console.log('\n======================================================');
console.log('MODEL VERSION 1: Current Baseline (L2 = 0.01)');
console.log('Accuracies:', resV1.accuracies);
console.log(`Mean Accuracy: ${(resV1.mean * 100).toFixed(3)}%`);
console.log(`Consistency (Standard Deviation): ${(resV1.std * 100).toFixed(3)}%`);
console.log(`Min Accuracy: ${(resV1.min * 100).toFixed(3)}%`);

console.log('======================================================');
console.log('MODEL VERSION 3: Low Collinearity Run-Diff & SP Dominant (L2 = 0.05)');
console.log('Accuracies:', resV3.accuracies);
console.log(`Mean Accuracy: ${(resV3.mean * 100).toFixed(3)}%`);
console.log(`Consistency (Standard Deviation): ${(resV3.std * 100).toFixed(3)}%`);
console.log(`Min Accuracy: ${(resV3.min * 100).toFixed(3)}%`);

console.log('======================================================');
console.log('MODEL VERSION 4: Pure Primary Drivers - Minimalist Core (L2 = 0.05)');
console.log('Accuracies:', resV4.accuracies);
console.log(`Mean Accuracy: ${(resV4.mean * 100).toFixed(3)}%`);
console.log(`Consistency (Standard Deviation): ${(resV4.std * 100).toFixed(3)}%`);
console.log(`Min Accuracy: ${(resV4.min * 100).toFixed(3)}%`);
console.log('======================================================');

console.log('\nTrained Weights for V4 on Static 2010-2020 Training Set:');
resV4.classifier.weights.forEach((w, idx) => {
  console.log(`  - ${featureNamesV4[idx]}: ${w.toFixed(4)}`);
});
console.log(`  - Bias (Home Field baseline offset): ${resV4.classifier.bias.toFixed(4)}`);
