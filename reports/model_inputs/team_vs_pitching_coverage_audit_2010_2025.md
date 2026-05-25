# Team vs Pitching Coverage Audit (2010-2025)

- Team: `data/processed/team/pregame_features_2010_2025.csv`
- Pitching: `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`

| season | team_row_count | pitching_row_count | overlap_gamePk | unmatched_team | unmatched_pitching |
|---|---:|---:|---:|---:|---:|
| 2010 | 2429 | 2429 | 2429 | 0 | 0 |
| 2011 | 2429 | 2429 | 2429 | 0 | 0 |
| 2012 | 2430 | 2430 | 2430 | 0 | 0 |
| 2013 | 2431 | 2431 | 2431 | 0 | 0 |
| 2014 | 2430 | 2430 | 2430 | 0 | 0 |
| 2015 | 2429 | 2429 | 2429 | 0 | 0 |
| 2016 | 2428 | 2428 | 2428 | 0 | 0 |
| 2017 | 2430 | 2430 | 2430 | 0 | 0 |
| 2018 | 2431 | 2431 | 2431 | 0 | 0 |
| 2019 | 2429 | 2429 | 2429 | 0 | 0 |
| 2020 | 898 | 898 | 898 | 0 | 0 |
| 2021 | 2428 | 2428 | 2428 | 0 | 0 |
| 2022 | 2430 | 2430 | 2430 | 0 | 0 |
| 2023 | 2430 | 2430 | 2430 | 0 | 0 |
| 2024 | 2429 | 2429 | 2429 | 0 | 0 |
| 2025 | 2427 | 2429 | 2427 | 0 | 2 |

- gamePk 265778 is NOT present in rebuilt team file (old bad row not carried forward).

## Explicit mismatch details
- Unmatched pitching gamePk values: 778563, 778564.
- Both are 2025 CHC vs LAD games on 2025-03-18 and 2025-03-19 present in pitching export but absent from local `src/data/mlb_games_2025.json`; therefore they are absent from rebuilt team features.
