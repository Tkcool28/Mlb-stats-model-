# Missing 2025 Games Patch Report

## Patched gamePk values
- 778563
- 778564

## Source/API used
- MLB Stats API game feed endpoint:
  - `https://statsapi.mlb.com/api/v1.1/game/778563/feed/live`
  - `https://statsapi.mlb.com/api/v1.1/game/778564/feed/live`

## Pitching export reference rows
From `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`:
- 778563: 2025-03-18, season 2025, CHC vs LAD, starters Shota Imanaga vs Yoshinobu Yamamoto
- 778564: 2025-03-19, season 2025, CHC vs LAD, starters Justin Steele vs Roki Sasaki

## Final normalized rows added
Added to `data/raw/games/mlb_games_2025.json`:
- `{gamePk: 778563, date: 2025-03-18, season: 2025, home_team: CHC, away_team: LAD, home_score: 1, away_score: 4, game_type: R, status: Final}`
- `{gamePk: 778564, date: 2025-03-19, season: 2025, home_team: CHC, away_team: LAD, home_score: 3, away_score: 6, game_type: R, status: Final}`

Added to `src/data/mlb_games_2025.json` (builder source schema):
- `{gamePk: 778563, date: 2025-03-18, homeAbbr: CHC, awayAbbr: LAD, homeScore: 1, awayScore: 4}`
- `{gamePk: 778564, date: 2025-03-19, homeAbbr: CHC, awayAbbr: LAD, homeScore: 3, awayScore: 6}`

## Validation
- Both games are regular season (`game_type=R`) and final (`status=Final`).
- Team/date alignment matches pitching export.

## Before/after coverage
- Team feature rows before patch: 37,338
- Team feature rows after patch: 37,340
- Unmatched pitching gamePk before patch: 2
- Unmatched pitching gamePk after patch: 0

## Final result
PASS: Team and pitching game universes are fully aligned for 2010-2025 (37,340 rows each), and combined merge completes with zero unmatched gamePk values.
