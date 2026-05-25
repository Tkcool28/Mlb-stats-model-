# Team Feature Rebuild System Inspection (2010-2025)

## Existing builder discovery
- Current team-feature logic originally lives in `scripts/training/train_baseline_lgbm.py` (it builds `pregame_features_2010_2025.csv` inline before model training).  
- It uses split game JSON files from `src/data/mlb_games_<season>.json` (or fallback `src/data/mlb_games.json`).

## Why old output was only 2010-partial 2014
- The previous team CSV under `data/processed/team/pregame_features_2010_2025.csv` was a stale partial artifact (10,375 rows) and did not reflect full source coverage.
- The source split files in `src/data/` do span 2010-2025, so the old short coverage came from prior artifact generation state, not from complete absence of split files.

## Raw coverage check
- Source game files used for rebuild: `src/data/mlb_games_2010.json` ... `src/data/mlb_games_2025.json`.
- Rebuild also materialized normalized raw files to: `data/raw/games/mlb_games_<season>.json`.
- Required raw fields used by builder are present in normalized rows: `gamePk`, `date`, `season`, `home_team`, `away_team`, `home_score`, `away_score`.

## Raw data pull requirement
- A new external pull was **not** required for most seasons because local split files already existed.
- Coverage mismatch remained for 2 games in 2025 (`gamePk` 778563, 778564): these exist in pitching export but are absent from local `src/data` split files, so full alignment would require refreshing 2025 raw schedule/game source.
