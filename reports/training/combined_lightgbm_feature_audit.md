# Combined LightGBM Feature Audit

- path: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- row count: 37340
- column count: 134
- date range: 2010-04-04 to 2025-09-28

## Season counts
- 2010: 2429
- 2011: 2429
- 2012: 2430
- 2013: 2431
- 2014: 2430
- 2015: 2429
- 2016: 2428
- 2017: 2430
- 2018: 2431
- 2019: 2429
- 2020: 898
- 2021: 2428
- 2022: 2430
- 2023: 2430
- 2024: 2429
- 2025: 2429

## Target audit
- target column: result_home_win
- target distribution: {1: 19955, 0: 17385}
- home win rate baseline: 0.534413

## Missing values by column
- away_bullpen_last_source_date: 241 (0.6454%)
- away_last_source_date: 241 (0.6454%)
- home_last_source_date: 239 (0.6401%)
- home_bullpen_last_source_date: 239 (0.6401%)

## High missingness columns (>5%)
- none

## Duplicate/id audit
- duplicate gamePk count: 0
- duplicate rows count: 0
- gamePk unique: YES

## Data type audit
- non-numeric columns: ['date', 'home_team', 'away_team', 'home_used_fallback', 'away_used_fallback', 'home_last_source_date', 'away_last_source_date', 'homeStarterName', 'awayStarterName', 'home_used_fallback_pitching', 'away_used_fallback_pitching', 'home_bullpen_used_fallback', 'home_bullpen_last_source_date', 'away_bullpen_used_fallback', 'away_bullpen_last_source_date']
- boolean columns: ['home_used_fallback', 'away_used_fallback', 'home_used_fallback_pitching', 'away_used_fallback_pitching', 'home_bullpen_used_fallback', 'away_bullpen_used_fallback']
- object columns: ['date', 'home_team', 'away_team', 'home_last_source_date', 'away_last_source_date', 'homeStarterName', 'awayStarterName', 'home_bullpen_last_source_date', 'away_bullpen_last_source_date']
- ID/date/team columns: ['gamePk','date','home_team','away_team','season']

## Exclusion/leakage audit
{
  "identifiers": [
    "gamePk"
  ],
  "dates": [
    "date"
  ],
  "teams": [
    "home_team",
    "away_team"
  ],
  "split_metadata": [
    "season"
  ],
  "targets": [
    "result_home_win"
  ],
  "raw_scores_or_results": [
    "home_runs_scored_per_game_pre_game",
    "away_runs_scored_per_game_pre_game"
  ],
  "suspicious_needs_review": [
    "away_current_win_streak_pre_game",
    "away_last_10_win_pct",
    "away_win_pct_pre_game",
    "home_current_win_streak_pre_game",
    "home_last_10_win_pct",
    "home_win_pct_pre_game"
  ]
}

## Suspicious / needs review before training
- away_current_win_streak_pre_game
- away_last_10_win_pct
- away_runs_allowed_per_game_pre_game
- away_runs_scored_per_game_pre_game
- away_win_pct_pre_game
- home_current_win_streak_pre_game
- home_last_10_win_pct
- home_runs_allowed_per_game_pre_game
- home_runs_scored_per_game_pre_game
- home_win_pct_pre_game
- result_home_win