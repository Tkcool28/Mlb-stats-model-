# Release Artifacts Manifest (2010-2025)

## raw_games_2010_2025.zip
- size_bytes: 389001
- sha256: `e7647695d55bc7a0de79382e09a1bafe8e07f1c6251e59294734833f56714f55`
- purpose: raw normalized MLB games 2010-2025
- restore_destination_path: `data/raw/games/`
- source_files: ['data/raw/games/mlb_games_2010.json', 'data/raw/games/mlb_games_2011.json', 'data/raw/games/mlb_games_2012.json', 'data/raw/games/mlb_games_2013.json', 'data/raw/games/mlb_games_2014.json', 'data/raw/games/mlb_games_2015.json', 'data/raw/games/mlb_games_2016.json', 'data/raw/games/mlb_games_2017.json', 'data/raw/games/mlb_games_2018.json', 'data/raw/games/mlb_games_2019.json', 'data/raw/games/mlb_games_2020.json', 'data/raw/games/mlb_games_2021.json', 'data/raw/games/mlb_games_2022.json', 'data/raw/games/mlb_games_2023.json', 'data/raw/games/mlb_games_2024.json', 'data/raw/games/mlb_games_2025.json']

## processed_team_features_2010_2025.csv.gz
- size_bytes: 1733139
- sha256: `dfe545af8af1f1a0fce8a5b558564729d5841a858d369e5ba5c9de927a558bc2`
- purpose: team rolling pregame features
- restore_destination_path: `data/processed/team/pregame_features_2010_2025.csv`
- rows: 37340
- columns: 29
- source_files: ['data/processed/team/pregame_features_2010_2025.csv']

## pitching_features_export_2010_2025.csv.gz
- size_bytes: 16675609
- sha256: `19e6d8705e127f882934e9cd7ed071015f2fa268930eb6945e43ce8c2cd30544`
- purpose: pitching feature export
- restore_destination_path: `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`
- rows: 37340
- columns: 110
- source_files: ['data/processed/pitching/pitching_features_export_2010_2025.csv.gz']

## model_input_team_pitching_2010_2025.csv.gz
- size_bytes: 18524911
- sha256: `ea85ed9a71c06c937e60e7f3c492f48ebb7683669145231f70694b735c236926`
- purpose: combined team+pitching model input
- restore_destination_path: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- rows: 37340
- columns: 134
- source_files: ['data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv']

## reports_bundle_2010_2025.zip
- size_bytes: 16401
- sha256: `a21e15b622ec6b6aa76fde5504d381643a593d62444bde2fc4e1d537f24d89f4`
- purpose: audit reports bundle
- restore_destination_path: `reports/`
- source_files: ['reports/**/*.md']
