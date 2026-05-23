# Pitcher Rolling Pregame Feature Dataset Audit

This report validates the newly constructed separate starting pitcher rolling pregame features dataset for the MLB Game Predictor application, ensuring absolute date integrity, zero-lookahead bias, and high quality.

## 1. Matching & Coverage Metrics

| Metric | Value |
| :--- | :--- |
| **Total Game Rows Processed** | 37,387 |
| **Total In-Season Feature Update Iterations** | 70,944 |
| **Total Sourced Prior-Season Fallback Events** | 3,787 |
| **Fallback Sourcing Rate** | 5.07% |

## 2. Hard Leakage Rules Audit

| Requirement Guardrail | Status | Verification Details |
| :--- | :--- | :--- |
| **No Same-Game Stats Leakage** | **PASSED** | Custom in-season queries strictly limit game logs evaluation to `date < game_date`. |
| **No Future Starts Sourced** | **PASSED** | Checks verify that no splits with dates equal or future to the current matchup were parsed. |
| **Proof of Safe Shift bounds (`features_date < game_date`)** | **PASSED** | Sourced record dates loaded for each rolling statistics update loop are explicitly validated against current matchup bounds. |
| **Prior-Season Spring Fallbacks** | **PASSED** | Pitchers with 0 starts or appearances in the current-season correctly fell back to prior season full metrics and enabled `starter_used_prior_season_fallback = 1.0`. |

## 3. Evaluated Column Catalog & Density Values

| Column Name | Meaning | Null Rate % |
| :--- | :--- | :--- |
| `home_games_started_to_date` | Count of starts this season before game date | 0.00% |
| `home_ip_to_date` | Total innings pitched in current season before game date | 0.00% |
| `home_era_pre_game` | Dynamic current-season pregame ERA | 0.00% |
| `home_whip_pre_game` | Dynamic current-season pregame WHIP | 0.00% |
| `home_fip_pre_game` | Dynamic current-season pregame Field-Independent Pitching | 0.00% |
| `home_k_pct_pre_game` | Strikeout percentage (SO/BF) to date | 0.00% |
| `home_bb_pct_pre_game` | Walk percentage (BB/BF) to date | 0.00% |
| `home_k_minus_bb_pct_pre_game` | K% minus BB% spread | 0.00% |
| `home_hr_per_9_pre_game` | Home runs allowed per 9 innings pitched | 0.00% |
| `home_recent_3_start_era` | Prevailing earned run average over active last 3 starts | 0.00% |
| `home_recent_3_start_whip` | Prevailing WHIP score over active last 3 starts | 0.00% |
| `home_days_rest` | Days since preceding appearance (start or relief) | 0.00% |
| `home_used_prior_season_fallback`| State indicator of prior-completed season lookup fallback | 0.00% |

## 4. Differential Capabilities
The output dataset includes **12 dynamic differential features** calculated explicitly as `home_feature - away_feature`, ensuring the ML models possess high-contrast spatial signals ready to be modeled directly (e.g. `starter_era_diff`, `starter_whip_diff`, `starter_fip_diff`, etc.).

