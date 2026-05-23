# End-to-End Pitcher Feature Path & Date Leakage Audit Report

This report documents the end-to-end architecture, implementation details, and leakage audit of the MLB Starting Pitcher pregame feature pipeline constructed for the MLB Game Predictor application.

---

## 🔍 Executive Summary Table

| Audit Question | Audit Finding / Resolution | Source File Location |
| :--- | :--- | :--- |
| **1. Which file creates pitcher features?** | `/scripts/build_pitcher_features.py` | `scripts/build_pitcher_features.py` |
| **2. Stat Sourcing Basis** | Sourced exclusively from **prior season full-season stats** ($Y-1$, $Y-2$, etc.). Days of rest calculation is the only in-season metric, computed chronologically pre-match. | `scripts/build_pitcher_features.py` |
| **3. Strict Chronological Shifting?** | **YES (CONFIRMED)**. Prior-season queries strictly exclude the current year, and days of rest calculations explicitly assert `previous_pitch_date < current_game_date`. | `scripts/build_pitcher_features.py` |
| **4. final_training_features Columns** | **None**. The baseline LightGBM model trained inside `train_baseline_lgbm.py` contains **zero** starter columns. | `scripts/train_baseline_lgbm.py` |
| **5. Model Training vs. UI/Manual Mode** | LightGBM trains exclusively on **team-level features**. Pitcher stats (such as ERA, WHIP, SO/BB) dynamically hydrate scheduled matchups at runtime and are evaluated via an on-the-fly L2 Logistic Regression. | `server.ts`, `src/lib/ml.ts` |
| **6. Final Booster Feature List** | Contains exactly **15 independent, team-level rolling cumulative variables**. | `models/stats_model/lightgbm_stats_moneyline.json` |

---

## ⚾ 1. Core Feature Construction Engine (`build_pitcher_features.py`)

The pipeline in `/scripts/build_pitcher_features.py` compiles player-level pitching data end-to-end:
1. **Games Parsing**: Loads sorted split season files (`mlb_games_*.json`) from `/src/data`.
2. **Stats Sourcing**: Dynamically pulls/caches season-by-season MLB stats using the official MLB Stats API, indexing player-level metadata (such as throwing hand code) and core season aggregates.
3. **Derived Metrics**: Evaluates K%, BB%, K-BB%, WHIP, HR/9, and Field Independent Pitching (FIP) with custom constants using standard formulas:
   $$\text{FIP} = \frac{13 \times \text{HR} + 3 \times (\text{BB} + \text{HBP}) - 2 \times \text{SO}}{\text{IP}} + 3.20$$
4. **Days of Rest Tracking**: Chains starts chronologically for each individual pitcher and computes exact rest days using game date offsets.

---

## ⏳ 2. Stat Sourcing & Temporal Guardrails (Zero Leakage Proof)

To protect the model from **future data leakage or lookahead bias**:
- **Strict Year Bounds ($< Y$)**: When predicting a game in season $Y$, the lookup searches completed seasons strictly prior (e.g. $Y-1$ and before). Current-season total stats (e.g., final ERA at the end of year $Y$) are **never** provided to the features vector of a game in year $Y$.
- **Days of Rest Boundaries**: Calculated strictly using the historical calendar dates of previous team matchups or individual index listings:
  $$\text{Days of Rest} = \text{Game Date} - \text{Last Pitch Date}$$
  An explicit validation guardrail asserts that `last_pitch_date < current_game_date`. If any same-day or future pitch date is retrieved, the pipeline raises a date-leakage exception.

---

## 📊 3. Feature Set Alignment in LightGBM Training (`train_baseline_lgbm.py`)

The baseline model developed in `/scripts/train_baseline_lgbm.py` **excludes** starting pitcher features from training. This was done to guarantee that the baseline model can be trained on a 100% clean, verified, leakage-safe team history. 

The processed training dataset is saved at:
`/data/processed/stats_model/pregame_features_2010_2025.csv`

While the pitcher-specific pregame features are fully constructed and saved separately at:
`/data/processed/stats_model/pitcher_pregame_features_2010_2025.csv`

---

## 💻 4. Hydration and Unified Real-Time Inference (`server.ts` & `ml.ts`)

In the target application, the pitcher features are utilized dynamically high-leverage:
1. **Dynamic Scheduled Hydration**: When the UI hydrates scheduled games on the system calendar, the server queries the pitcher's ID in `/api/pitchers` (sourced from master database `mlb_pitchers.json`) and loads their active season attributes.
2. **Interactive Manual Mocking/Override**: Users can fine-tune or override individual pitcher parameters (such as Starter Season ERA, WHIP, Strikeout-Walk ratio) directly inside the multi-parameter dashboard.
3. **L2 Logistic Regression Solver**: Generates moneyline probabilities using a high-contrast L2-regularized logistic regression, weighing differences in team strength, run differentials, starter ERA advantage, WHIP advantage, and strikeout-walk difference:
   $$\mathbf{x} = [ \Delta \text{Win\%}, \Delta \text{Run Diff}, \Delta \text{Starter ERA}, \Delta \text{Starter WHIP}, \Delta \text{Starter K/BB}, \Delta \text{Bullpen Save\%}, \text{Home Field Flag} ]$$

---

## 🌲 5. Final Booster Feature Name List (`models/stats_model/lightgbm_stats_moneyline.json`)

The trained LightGBM model uses exactly **15 independent variables** logged natively inside the Booster model data parameters:

```json
[
  "home_win_pct_pre_game",
  "away_win_pct_pre_game",
  "home_run_diff_per_game_pre_game",
  "away_run_diff_per_game_pre_game",
  "home_runs_scored_per_game_pre_game",
  "away_runs_scored_per_game_pre_game",
  "home_runs_allowed_per_game_pre_game",
  "away_runs_allowed_per_game_pre_game",
  "home_last_10_win_pct",
  "away_last_10_win_pct",
  "home_last_10_run_diff_per_game",
  "away_last_10_run_diff_per_game",
  "home_games_played_to_date",
  "away_games_played_to_date",
  "home_field_flag"
]
```

---

**Audit Compiled By:** MLB Game Predictor Security Node  
**Verdict:** 🟢 **FULLY AUDITED & APPROVED** (Absolute zero target/date leakage detected across pitcher feature compilation path)
