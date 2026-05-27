# MLB Stats Model Repository

## Project layout

- `data/raw/` = original raw downloaded game/source files only.
- `data/external/` = imported data from outside systems or other repos.
- `data/interim/` = temporary intermediate outputs.
- `data/processed/team/` = team rolling feature tables (team-only baseline input).
- `data/processed/pitching/` = starter + bullpen pitching feature exports.
- `data/processed/model_inputs/` = model-ready joined feature tables.

- `scripts/data/` = data import/build scripts.
- `scripts/features/` = feature creation and merge scripts.
- `scripts/training/` = model training scripts.
- `scripts/validation/` = validation and audit scripts.

- `models/team_only/` = existing team-only model artifacts.
- `models/team_pitching/` = future combined-model artifacts.

- `reports/team/` = team feature/model reports.
- `reports/pitching/` = pitching feature reports.
- `reports/model_inputs/` = combined input merge audits.

- `configs/` = future config files and split settings.
- `docs/` = workflow notes and repo documentation.

## Current status

- Team-only LightGBM baseline exists and remains preserved.
- Pitching export has been imported into the processed pitching area.
- Next step is combined team + pitching LightGBM training.
- Odds/market features are intentionally not included yet.


## Large Data Artifacts

Large raw/processed/model artifacts are stored in GitHub Releases rather than tracked in Git to keep Codex/Git operations fast.

Use:
`python scripts/data/restore_release_artifacts.py --local-artifacts-dir artifacts/release`

Expected release artifact names:
- `raw_games_2010_2025.zip`
- `processed_team_features_2010_2025.csv.gz`
- `pitching_features_export_2010_2025.csv.gz`
- `model_input_team_pitching_2010_2025.csv.gz`

Expected restored shapes:
- team features rows: 37,340
- pitching rows: 37,340
- combined rows: 37,340
- combined columns: 134


### Restore data locally when needed

Large datasets are stored in GitHub Releases (tag `v0.1-data-2010-2025`), not tracked in Git.
Codex/local development does not need these files unless running data/model jobs.

To restore all required datasets locally:

`python scripts/data/restore_release_artifacts.py`


## Current Stats Winner Model Baseline

The current clean baseline is:

**Stats Winner Model v2 — Combined Team + Pitching LightGBM**

Purpose:
- Predict home team win probability using pregame team, starter, and bullpen features.
- Serve as the stats-side signal layer for a future app.
- This is not an odds/value/ROI model yet.

Current status:
- Dataset: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- Target: `result_home_win`
- Split:
  - Train: 2010–2018
  - Validation: 2019–2020
  - Test: 2021–2025
- Starter ID features are excluded:
  - `homeStarterId`
  - `awayStarterId`
- Odds/market features are intentionally excluded.

Latest test metrics:
- Accuracy: 0.556233
- Log loss: 0.681206
- ROC AUC: 0.580313
- Brier score: 0.244097

Confidence audit:
- Overall test accuracy: 55.62%
- 0.60+ confidence: 3,080 games, 62.92% accuracy
- 0.65+ confidence: 902 games, 67.07% accuracy
- 0.70+ confidence: 144 games, 68.75% accuracy

Interpretation:
- The model is a usable baseline stats signal.
- It is not final production logic by itself.
- It should eventually be combined with odds/value/ROI models.
- For future app logic, `0.65+` confidence is currently the strongest useful stats-model signal zone.
- The model can be paused for now while work continues on the odds and ROI model layers.

Relevant files:
- Feature config: `configs/combined_lightgbm_features.json`
- Training script: `scripts/training/train_combined_lightgbm.py`
- Training report: `reports/training/combined_lightgbm_training_report.md`
- Feature importance: `reports/training/combined_lightgbm_feature_importance.csv`
- Prediction audit: `reports/training/combined_lightgbm_prediction_audit.md`
- Test predictions: `reports/training/combined_lightgbm_test_predictions.csv`
