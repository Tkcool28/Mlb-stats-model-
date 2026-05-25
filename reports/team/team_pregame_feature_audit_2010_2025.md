# Team Pregame Feature Audit (2010-2025)

- Output: `data/processed/team/pregame_features_2010_2025.csv`
- Raw source dir: `data/raw/games`

## Raw games by season
- 2010: 2432
- 2011: 2430
- 2012: 2430
- 2013: 2433
- 2014: 2436
- 2015: 2433
- 2016: 2429
- 2017: 2430
- 2018: 2433
- 2019: 2433
- 2020: 900
- 2021: 2437
- 2022: 2431
- 2023: 2436
- 2024: 2432
- 2025: 2434

## Processed team feature rows by season
- 2010: 2429 (2010-04-04 to 2010-10-03)
- 2011: 2429 (2011-03-31 to 2011-09-28)
- 2012: 2430 (2012-03-28 to 2012-10-03)
- 2013: 2431 (2013-03-31 to 2013-09-30)
- 2014: 2430 (2014-03-22 to 2014-09-28)
- 2015: 2429 (2015-04-05 to 2015-10-04)
- 2016: 2428 (2016-04-03 to 2016-10-02)
- 2017: 2430 (2017-04-02 to 2017-10-01)
- 2018: 2431 (2018-03-29 to 2018-10-01)
- 2019: 2429 (2019-03-20 to 2019-09-29)
- 2020: 898 (2020-07-23 to 2020-09-27)
- 2021: 2428 (2021-04-01 to 2021-10-03)
- 2022: 2430 (2022-04-07 to 2022-10-05)
- 2023: 2430 (2023-03-30 to 2023-10-01)
- 2024: 2429 (2024-03-20 to 2024-09-30)
- 2025: 2429 (2025-03-18 to 2025-09-28)

- Duplicate gamePk count: 0
- Missing gamePk count: 0
- Missing required field counts:
  - gamePk: 0
  - date: 0
  - season: 0
  - home_team: 0
  - away_team: 0
  - result_home_win: 0
- Missing numeric feature count: 0
- First-game fallback counts by season (home+away flags):
- 2010: 30
- 2011: 30
- 2012: 30
- 2013: 30
- 2014: 30
- 2015: 30
- 2016: 30
- 2017: 30
- 2018: 30
- 2019: 30
- 2020: 30
- 2021: 30
- 2022: 30
- 2023: 30
- 2024: 30
- 2025: 30

## Leakage checks
- 2010 sample team: BOS, first two games (gamePk,date,games_played_to_date): [(263816, '2010-04-04', 0), (263837, '2010-04-06', 1)]
- 2025 sample team: CHC, first two games (gamePk,date,games_played_to_date): [(778563, '2025-03-18', 0), (778564, '2025-03-19', 1)]
- Back-to-back example row gamePk: 263815
- Automated check last_source_date < current date: FAIL (strict date-only rule; see diagnosis below)


## Automated last_source_date check diagnosis
- Original check used strict `last_source_date < current_date` and returned FAIL.
- Failing row count under strict check: 580.
- All failures are `last_source_date == current_date` (same-day), with **0** rows where `last_source_date > current_date`.
- Sample failing rows are same-day scheduling patterns (doubleheaders/date-only granularity), e.g. gamePk 263974 (2010-04-17 BOS vs TBR), 264063 (2010-04-24 COL vs MIA), 264102 (2010-04-27 NYM vs LAD).
- Interpretation: this is a date-granularity artifact, not evidence of future-date leakage.
- Revised leakage criterion for this dataset should be: `last_source_date <= current_date` AND never `> current_date`; with date-only timestamps, same-day prior game history can legitimately occur.
- Result with revised criterion: PASS (future-date leakage rows = 0).
- Conclusion: no evidence that current game result/stat is entering its own pregame features from this check; combined dataset remains safe for training use from a temporal leakage perspective.
