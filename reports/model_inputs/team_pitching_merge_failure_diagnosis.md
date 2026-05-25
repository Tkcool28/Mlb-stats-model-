# Team + Pitching Merge Failure Diagnosis

## Inputs
- Team file: `data/processed/team/pregame_features_2010_2025.csv`
- Pitching file: `data/processed/pitching/pitching_features_export_2010_2025.csv.gz`

## Team file checks
- Row count: 10375
- Duplicate gamePk count: 0
- Missing gamePk count: 0
- Missing required field counts:
  - gamePk: 0
  - date: 0
  - season: 0
  - home_team: 0
  - away_team: 0
  - result_home_win: 0
- Seasons present: [2010, 2011, 2012, 2013, 2014]
- Team season count: 5

### Team row count and date range by season
| season | row_count | min_date | max_date |
|---|---|---|---|
| 2010 | 2430 | 2010-04-04 | 2010-10-03 |
| 2011 | 2429 | 2011-03-31 | 2011-09-28 |
| 2012 | 2430 | 2012-03-28 | 2012-10-03 |
| 2013 | 2431 | 2013-03-31 | 2013-09-30 |
| 2014 | 655 | 2014-03-22 | 2014-05-19 |

## Pitching file checks
- Row count: 37340
- Duplicate gamePk count: 0
- Missing gamePk count: 0
- Seasons present: [2010, 2011, 2012, 2013, 2014] ... [2021, 2022, 2023, 2024, 2025]
- Pitching season count: 16

### Pitching row count and date range by season
| season | row_count | min_date | max_date |
|---|---|---|---|
| 2010 | 2429 | 2010-04-04 | 2010-10-03 |
| 2011 | 2429 | 2011-03-31 | 2011-09-28 |
| 2012 | 2430 | 2012-03-28 | 2012-10-03 |
| 2013 | 2431 | 2013-03-31 | 2013-09-30 |
| 2014 | 2430 | 2014-03-22 | 2014-09-28 |
| 2015 | 2429 | 2015-04-05 | 2015-10-04 |
| 2016 | 2428 | 2016-04-03 | 2016-10-02 |
| 2017 | 2430 | 2017-04-02 | 2017-10-01 |
| 2018 | 2431 | 2018-03-29 | 2018-10-01 |
| 2019 | 2429 | 2019-03-20 | 2019-09-29 |
| 2020 | 898 | 2020-07-23 | 2020-09-27 |
| 2021 | 2428 | 2021-04-01 | 2021-10-03 |
| 2022 | 2430 | 2022-04-07 | 2022-10-05 |
| 2023 | 2430 | 2023-03-30 | 2023-10-01 |
| 2024 | 2429 | 2024-03-20 | 2024-09-30 |
| 2025 | 2429 | 2025-03-18 | 2025-09-28 |

## Team vs pitching by season (gamePk overlap)
| season | team_rows | pitching_rows | overlap_count | unmatched_team | unmatched_pitching |
|---|---|---|---|---|---|
| 2010 | 2430 | 2429 | 2429 | 1 | 0 |
| 2011 | 2429 | 2429 | 2429 | 0 | 0 |
| 2012 | 2430 | 2430 | 2430 | 0 | 0 |
| 2013 | 2431 | 2431 | 2431 | 0 | 0 |
| 2014 | 655 | 2430 | 655 | 0 | 1775 |
| 2015 | 0 | 2429 | 0 | 0 | 2429 |
| 2016 | 0 | 2428 | 0 | 0 | 2428 |
| 2017 | 0 | 2430 | 0 | 0 | 2430 |
| 2018 | 0 | 2431 | 0 | 0 | 2431 |
| 2019 | 0 | 2429 | 0 | 0 | 2429 |
| 2020 | 0 | 898 | 0 | 0 | 898 |
| 2021 | 0 | 2428 | 0 | 0 | 2428 |
| 2022 | 0 | 2430 | 0 | 0 | 2430 |
| 2023 | 0 | 2430 | 0 | 0 | 2430 |
| 2024 | 0 | 2429 | 0 | 0 | 2429 |
| 2025 | 0 | 2429 | 0 | 0 | 2429 |

## gamePk 265778 investigation
- Present in team file: True
- Team row: date=2010-08-31, season=2010, home_team=BAL, away_team=BOS, result_home_win=1
- Present in pitching file: False
- Merge failure reason: inner merge drops this gamePk because it is in team but absent in pitching.

## Coverage assessment
- Team file is not a full 2010–2025 table; it only contains seasons 2010–2014 and 2014 is partial.
- Pitching file spans 2010–2025 and contains many gamePk outside team-file coverage, causing large unmatched_pitching counts.
- Team rows (~10k) look like a modeling subset compared to full-game history in pitching (~37k).

## Recommendation
- Regenerate team pregame features for full 2010–2025 coverage using the same game universe as pitching export, then rerun strict merge audit. Do not force PASS until row-loss is truly resolved.
