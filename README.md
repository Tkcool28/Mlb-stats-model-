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
