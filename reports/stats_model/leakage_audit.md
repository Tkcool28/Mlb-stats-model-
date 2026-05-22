# Leakage Audit Report

**Date of Audit:** 2026-05-22 15:23:10 UTC
**Subject Model:** LightGBM Binary Stats Model (`LGBMClassifier`)

## Audit Verification Checklist

| Audit Rule Check | Status | Description / Empirical Verification Evidence |
| :--- | :---: | :--- |
| **Are full-season team stats used for games inside that same season?** | **NO (PASSED)** | All team metrics are calculated rolling-only using strictly previous historical games played from that season. S-1/S-2 baseline averages are NEVER aggregated from current matching parameters. |
| **Are target/result columns used as features?** | **NO (PASSED)** | Checked feature schema. The matchup result variable `result_home_win` is strictly processed as the target class variable, and its value is appended to running histories strictly AFTER rolling parameters have been saved. |
| **Are future games used to calculate pregame features?** | **NO (PASSED)** | Matchup sorted lists are parsed linearly, matching only preceding indexes (`game_date < target_matchup_date`). Future matchups inside the same season are hidden. |
| **Are 2021–2025 holdout results used for training or tuning?** | **NO (PASSED)** | Training instances are restricted to range `[2010, 2020]`. Instantiation parameters and weights are trained only on this interval. Predictions on holdout games are completely out-of-sample. |
| **Are pitcher stats included?** | **NO (PASSED)** | Sourced starting pitcher stats from seasonal files were **EXCLUDED** from the model because they could not be compiled rolling-only on pregame instances. This completely isolates any possible player lookup target-leakage. |

## Feature-Specific Analysis

1. `home_win_pct_pre_game` and `away_win_pct_pre_game`: rolling cumulative ratio of recorded positive match closure outcomes, updated only after game closure. Passed audit checks.
2. `home_runs_scored_per_game_pre_game` and `home_runs_allowed_per_game_pre_game`: rolling averages computed strictly regarding historical played games. Meets security compliance.
3. `home_last_10_win_pct` and `away_last_10_win_pct`: rolling window slices, restricted to the preceding 10 matches relative to game day. Secure of target leakages.

**Final Audit Verdict:** **APPROVED / NO LEAKAGE DETECTED**
