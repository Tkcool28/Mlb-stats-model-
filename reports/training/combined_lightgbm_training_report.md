# Combined LightGBM Training Report

- dataset path: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- feature config path: `configs/combined_lightgbm_features.json`
- train rows: 21867
- validation rows: 3327
- test rows: 12146
- train seasons: 2010-2018
- validation seasons: 2019-2020
- test seasons: 2021-2025
- target mean train/val/test: 0.5360/0.5350/0.5315

## Baseline metrics
- train home win rate probability: 0.535967
- baseline test accuracy: 0.531451
- baseline test log loss: 0.691209

## LightGBM validation metrics
- log_loss: 0.674302
- accuracy: 0.574391
- brier: 0.240735
- roc_auc: 0.601811

## LightGBM test metrics
- log_loss: 0.681206
- accuracy: 0.556233
- brier: 0.244097
- roc_auc: 0.580313

## Top 20 features
- starter_ip_diff: 126
- home_run_diff_per_game_pre_game: 91
- away_run_diff_per_game_pre_game: 87
- home_runs_scored_per_game_pre_game: 72
- bullpen_k_pct_diff: 70
- starter_k_pct_diff: 70
- away_last_10_run_diff_per_game: 66
- away_bb_pct_pre_game: 66
- starter_bb_pct_diff: 65
- away_whip_pre_game: 64
- home_bullpen_bb_pct_pre_game: 63
- starter_fip_diff: 61
- starter_k_minus_bb_pct_diff: 59
- away_bullpen_whip_pre_game: 55
- home_runs_allowed_per_game_pre_game: 53
- home_fip_pre_game: 53
- home_whip_pre_game: 52
- away_era_pre_game: 52
- away_bullpen_bb_pct_pre_game: 51
- away_bullpen_fip_pre_game: 51

## Calibration table (test)
|bucket|count|avg_pred|actual_home_win_rate|
|---|---:|---:|---:|
|0.0-0.1|0|||
|0.1-0.2|0|||
|0.2-0.3|27|0.28302169607730804|0.37037037037037035|
|0.3-0.4|578|0.3688587169785364|0.39100346020761245|
|0.4-0.5|3070|0.4605195723701315|0.4726384364820847|
|0.5-0.6|5996|0.5491153955205771|0.5335223482321547|
|0.6-0.7|2358|0.6346838585173062|0.6306191687871077|
|0.7-0.8|117|0.7178785178746095|0.7008547008547008|
|0.8-0.9|0|||
|0.9-1.0|0|||

## Artifact
- model artifact path: `models/team_pitching/lightgbm_team_pitching_2010_2025.txt`
- model artifact size bytes: 462244

## Leakage sanity notes
- Checked configured exclusions for identifiers/date/teams/target and suspicious columns prior to fit.
- If metrics appear unusually strong, re-audit suspicious columns and split leakage.
- prediction output path: `reports/training/combined_lightgbm_test_predictions.csv`
- prediction audit report: `reports/training/combined_lightgbm_prediction_audit.md`