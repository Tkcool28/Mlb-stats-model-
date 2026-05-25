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
