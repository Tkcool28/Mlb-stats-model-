# Combined LightGBM Feature Audit (v2)

## Inclusion/Exclusion decisions
- Starter IDs excluded from model features: `homeStarterId`, `awayStarterId`.
- Included valid pregame team form/offense columns (if present & numeric):
  - home_win_pct_pre_game
  - away_win_pct_pre_game
  - home_last_10_win_pct
  - away_last_10_win_pct
  - home_current_win_streak_pre_game
  - away_current_win_streak_pre_game
  - home_runs_scored_per_game_pre_game
  - away_runs_scored_per_game_pre_game
- No target/result/postgame columns are included in `feature_columns`.

- Feature count: 114
- Excluded groups: ['identifiers', 'dates', 'teams', 'split_metadata', 'targets', 'raw_scores_or_results', 'suspicious_needs_review', 'raw_ids']