# Team + Pitching Feature Merge Audit (2010-2025)

## File paths used
- Team input: `data/processed/team/pregame_features_2010_2025.csv`
- Pitching input: `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`
- Combined output: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- Audit report: `reports/model_inputs/team_pitching_feature_merge_audit_2010_2025.md`

## Merge counts
- Team row count: 37340
- Pitching row count: 37340
- Merged row count: 37340
- Row loss count: 0
- Unmatched team gamePk count: 0
- Unmatched pitching gamePk count: 0

## Validation
- Duplicate gamePk count: 0
- Missing target count: 0
- Numeric missing count: 0
- Columns dropped during merge: ['date_pitching', 'season_pitching', 'homeAbbr', 'awayAbbr']

## Final row count by season
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

## Final column count
- 134

## First 25 columns
- gamePk, date, season, home_team, away_team, result_home_win, home_games_played_to_date, away_games_played_to_date, home_win_pct_pre_game, away_win_pct_pre_game, home_run_diff_per_game_pre_game, away_run_diff_per_game_pre_game, home_runs_scored_per_game_pre_game, away_runs_scored_per_game_pre_game, home_runs_allowed_per_game_pre_game, away_runs_allowed_per_game_pre_game, home_last_10_win_pct, away_last_10_win_pct, home_last_10_run_diff_per_game, away_last_10_run_diff_per_game, home_field_flag, home_current_win_streak_pre_game, away_current_win_streak_pre_game, home_rest_days, away_rest_days

## Last 25 columns
- away_bullpen_pitches_last_1_day, away_bullpen_pitches_last_3_days, away_bullpen_pitches_last_5_days, away_relievers_used_last_1_day, away_relievers_used_last_3_days, away_relievers_used_last_5_days, away_unique_relievers_used_last_1_day, away_unique_relievers_used_last_3_days, away_unique_relievers_used_last_5_days, away_bullpen_used_fallback, away_bullpen_source_games_to_date, away_bullpen_last_source_date, bullpen_era_diff, bullpen_whip_diff, bullpen_fip_diff, bullpen_k_pct_diff, bullpen_bb_pct_diff, bullpen_k_minus_bb_pct_diff, bullpen_hr_per_9_diff, bullpen_ip_to_date_diff, bullpen_pitches_to_date_diff, bullpen_ip_last_3_days_diff, bullpen_pitches_last_3_days_diff, relievers_used_last_3_days_diff, unique_relievers_used_last_3_days_diff

## Non-feature identifier/audit columns
- gamePk, date, season, home_team, away_team, result_home_win, homeStarterId, awayStarterId, homeStarterName, awayStarterName

PASS: Combined team + pitching model input is ready. It contains one row per game, result_home_win is present, gamePk is unique, numeric model features have no missing values, and pitcher/bullpen features were merged without target leakage columns.
