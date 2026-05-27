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
- log_loss: 0.674479
- accuracy: 0.577397
- brier: 0.240808
- roc_auc: 0.602885

## LightGBM test metrics
- log_loss: 0.681255
- accuracy: 0.558373
- brier: 0.244124
- roc_auc: 0.579706

## Top 20 features
- home_run_diff_per_game_pre_game: 116
- starter_ip_diff: 114
- homeStarterId: 111
- away_run_diff_per_game_pre_game: 110
- starter_k_minus_bb_pct_diff: 77
- starter_k_pct_diff: 74
- away_bb_pct_pre_game: 69
- away_last_10_run_diff_per_game: 68
- starter_bb_pct_diff: 66
- bullpen_k_pct_diff: 65
- away_whip_pre_game: 64
- home_runs_allowed_per_game_pre_game: 60
- away_k_pct_pre_game: 60
- home_k_minus_bb_pct_pre_game: 59
- starter_fip_diff: 59
- away_runs_allowed_per_game_pre_game: 59
- bullpen_k_minus_bb_pct_diff: 59
- bullpen_pitches_to_date_diff: 56
- awayStarterId: 56
- home_fip_pre_game: 55

## Calibration table (test)
|bucket|count|avg_pred|actual_home_win_rate|
|---|---:|---:|---:|
|0.0-0.1|0|||
|0.1-0.2|1|0.19263558486074753|0.0|
|0.2-0.3|32|0.27484601154549226|0.34375|
|0.3-0.4|617|0.36858367066827114|0.37763371150729336|
|0.4-0.5|3445|0.46036999109213217|0.4760522496371553|
|0.5-0.6|5910|0.5477778904691684|0.5414551607445008|
|0.6-0.7|2060|0.6345663719439136|0.6378640776699029|
|0.7-0.8|81|0.7173068150138613|0.7037037037037037|
|0.8-0.9|0|||
|0.9-1.0|0|||

## Artifact
- model artifact path: `models/team_pitching/lightgbm_team_pitching_2010_2025.txt`
- model artifact size bytes: 478564

## Leakage sanity notes
- Checked configured exclusions for identifiers/date/teams/target and suspicious columns prior to fit.
- If metrics appear unusually strong, re-audit suspicious columns and split leakage.