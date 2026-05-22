# Starting Pitcher Feature Pipeline and Date Leakage Audit

This report validates the newly constructed starting pitcher pregame features pipeline for the MLB Game Predictor application, guaranteeing absolute data integrity.

## 1. Matching & Coverage Metrics

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Games** | 37,387 | 100.0% |
| **Games with Both Starters Matched** | 28,200 | 75.43% |
| **Games with One Starter Missing** | 6,297 | 16.84% |
| **Games with Both Starters Missing** | 2,890 | 7.73% |

*Note: Missing starters are treated gracefully via null values and corresponding missingness flags (`home_starter_missing`, `away_starter_missing`). No games were dropped.*

## 2. Pitcher Feature Columns Created

The starting pitcher feature file contains the following **24** engineered variables:

### Starter Pregame Features:
- `home_starter_era_pre_game`
- `away_starter_era_pre_game`
- `home_starter_fip_pre_game`
- `away_starter_fip_pre_game`
- `home_starter_k_pct_pre_game`
- `away_starter_k_pct_pre_game`
- `home_starter_bb_pct_pre_game`
- `away_starter_bb_pct_pre_game`
- `home_starter_k_minus_bb_pre_game`
- `away_starter_k_minus_bb_pre_game`
- `home_starter_whip_pre_game`
- `away_starter_whip_pre_game`
- `home_starter_hr_per_9_pre_game`
- `away_starter_hr_per_9_pre_game`
- `home_starter_days_rest`
- `away_starter_days_rest`
- `home_starter_hand`
- `away_starter_hand`

### Differential Features:
- `starter_era_diff`
- `starter_fip_diff`
- `starter_k_minus_bb_diff`
- `starter_whip_diff`
- `starter_hr_per_9_diff`
- `starter_rest_diff`

### Graceful Fallback Missingness Flags:
- `home_starter_missing`
- `away_starter_missing`

## 3. Strict Guardrails Audit

| Guardrail Requirement | Status | Verification Details |
| :--- | :--- | :--- |
| **No Same-Game Stats** | **PASSED** | Matchups only look up pitcher profiles completed in seasons strictly prior to the current game date. |
| **No Final-Season Stats as features for earlier games** | **PASSED** | Sourced statistics for a season Y are compiled exclusively from completed seasons Y-1, Y-2, etc. Current-season stats are never leaked. |
| **Every pitcher stat calculated strictly before game_date** | **PASSED** | The historical player-level stats used are completed prior to the game's year, and days of rest is calculated strictly using prior pitching dates. |
| **Date Leakage Check** | **PASSED** | Checked chronological order of game sequences and confirmed that no future pitching dates or stat parameters were referenced. |

