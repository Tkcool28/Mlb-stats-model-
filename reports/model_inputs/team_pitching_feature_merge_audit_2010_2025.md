# Team + Pitching Feature Merge Audit (2010-2025)

## File paths used
- Team input: `data/processed/team/pregame_features_2010_2025.csv`
- Pitching input: `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`
- Combined output: `data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv`
- Audit report: `reports/model_inputs/team_pitching_feature_merge_audit_2010_2025.md`

## Merge counts
- Team row count: 10375
- Pitching row count: 37340
- Merged row count: 10374
- Row loss count: 1
- Unmatched team gamePk count: 1
- Unmatched pitching gamePk count: 26966

## Missing team gamePk by season
- 2010: 1
- Missing gamePk sample (max 25): [265778]

FAIL: Inner merge row loss detected; stopping per policy.
