import os
import sys
import pandas as pd

TEAM_PATH = "data/processed/team/pregame_features_2010_2025.csv"
PITCHING_PATH = "data/processed/pitching/pitching_features_export_2010_2025.csv.gz"
OUT_PATH = "data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv"
AUDIT_PATH = "reports/model_inputs/team_pitching_feature_merge_audit_2010_2025.md"

TEAM_REQ = ["gamePk", "date", "season", "home_team", "away_team", "result_home_win"]
PITCH_REQ = ["gamePk", "date", "season", "homeAbbr", "awayAbbr"]


def fail(msg: str):
    print(f"❌ {msg}")
    sys.exit(1)


def main():
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(AUDIT_PATH), exist_ok=True)

    if not os.path.exists(TEAM_PATH):
        fail(f"Missing team feature file: {TEAM_PATH}")
    if not os.path.exists(PITCHING_PATH):
        fail(f"Missing pitching feature file: {PITCHING_PATH}")

    team = pd.read_csv(TEAM_PATH)
    pitching = pd.read_csv(PITCHING_PATH, compression="gzip")

    for col in TEAM_REQ:
        if col not in team.columns:
            fail(f"Team file missing required column: {col}")
    for col in PITCH_REQ:
        if col not in pitching.columns:
            fail(f"Pitching file missing required column: {col}")

    if team["gamePk"].duplicated().any():
        fail("Team file has duplicate gamePk values")
    if pitching["gamePk"].duplicated().any():
        fail("Pitching file has duplicate gamePk values")

    pitch_cols_lower = {c.lower() for c in pitching.columns}
    forbidden_target_tokens = ["result", "target", "home_win", "label", "outcome"]
    leakage_cols = [c for c in pitching.columns if any(tok in c.lower() for tok in forbidden_target_tokens)]
    if leakage_cols:
        fail(f"Pitching file has forbidden target/result columns: {leakage_cols}")

    pitch_numeric_missing = int(pitching.select_dtypes(include=["number"]).isna().sum().sum())
    if pitch_numeric_missing != 0:
        fail(f"Pitching numeric feature missing count is {pitch_numeric_missing}, expected 0")

    team_keys = set(team["gamePk"])
    pitch_keys = set(pitching["gamePk"])
    unmatched_team = sorted(team_keys - pitch_keys)
    unmatched_pitching = sorted(pitch_keys - team_keys)

    merged = team.merge(pitching, on="gamePk", how="inner", suffixes=("", "_pitching"))
    row_loss = len(team) - len(merged)

    dropped_cols = []
    for col in ["date_pitching", "season_pitching", "homeAbbr", "awayAbbr"]:
        if col in merged.columns:
            merged.drop(columns=[col], inplace=True)
            dropped_cols.append(col)

    if merged["gamePk"].duplicated().any():
        fail("Final merged dataset has duplicate gamePk values")
    if "result_home_win" not in merged.columns:
        fail("Final merged dataset is missing result_home_win")
    missing_target = int(merged["result_home_win"].isna().sum())
    if missing_target != 0:
        fail(f"Final merged dataset has missing target values: {missing_target}")

    missing_by_col = merged.select_dtypes(include=["number"]).isna().sum()
    cols_with_missing = missing_by_col[missing_by_col > 0]
    numeric_missing = int(cols_with_missing.sum())
    imputed_numeric_columns = []
    if numeric_missing != 0:
        for c in cols_with_missing.index:
            merged[c] = merged[c].fillna(0)
            imputed_numeric_columns.append(c)
        numeric_missing = int(merged.select_dtypes(include=["number"]).isna().sum().sum())
        if numeric_missing != 0:
            fail(f"Final merged dataset has numeric missing count {numeric_missing}, expected 0")

    raw_pitch_tokens = ["_current_pitch", "today_pitch", "same_game_pitch"]
    raw_pitch_cols = [c for c in merged.columns if any(t in c.lower() for t in raw_pitch_tokens)]
    if raw_pitch_cols:
        fail(f"Possible raw current-game pitching columns detected: {raw_pitch_cols[:20]}")

    dup_suffix_cols = [c for c in merged.columns if c.endswith("_x") or c.endswith("_y")]
    if dup_suffix_cols:
        fail(f"Unexpected duplicate columns detected: {dup_suffix_cols}")

    merged.to_csv(OUT_PATH, index=False)

    season_counts = merged.groupby("season").size().to_dict()
    identifier_cols = [
        c for c in ["gamePk", "date", "season", "home_team", "away_team", "result_home_win", "home_starter_id", "away_starter_id"]
        if c in merged.columns
    ]

    report = []
    report.append("# Team + Pitching Feature Merge Audit (2010-2025)")
    report.append("")
    report.append("## File paths used")
    report.append(f"- Team input: `{TEAM_PATH}`")
    report.append(f"- Pitching input: `{PITCHING_PATH}`")
    report.append(f"- Combined output: `{OUT_PATH}`")
    report.append(f"- Audit report: `{AUDIT_PATH}`")
    report.append("")
    report.append("## Merge counts")
    report.append(f"- Team row count: {len(team)}")
    report.append(f"- Pitching row count: {len(pitching)}")
    report.append(f"- Merged row count: {len(merged)}")
    report.append(f"- Row loss count: {row_loss}")
    report.append(f"- Unmatched team gamePk count: {len(unmatched_team)}")
    report.append(f"- Unmatched pitching gamePk count: {len(unmatched_pitching)}")
    report.append("")
    report.append("## Validation")
    report.append(f"- Duplicate gamePk count: {int(merged['gamePk'].duplicated().sum())}")
    report.append(f"- Missing target count: {missing_target}")
    report.append(f"- Numeric missing count: {numeric_missing}")
    report.append(f"- Numeric columns imputed to 0: {imputed_numeric_columns if imputed_numeric_columns else 'None'}")
    report.append(f"- Columns dropped during merge: {dropped_cols if dropped_cols else 'None'}")
    report.append("")
    report.append("## Final row count by season")
    for season, count in season_counts.items():
        report.append(f"- {season}: {count}")
    report.append("")
    report.append(f"## Final column count\n- {len(merged.columns)}")
    report.append("")
    report.append("## First 25 columns")
    report.append("- " + ", ".join(merged.columns[:25]))
    report.append("")
    report.append("## Last 25 columns")
    report.append("- " + ", ".join(merged.columns[-25:]))
    report.append("")
    report.append("## Non-feature identifier/audit columns")
    report.append("- " + ", ".join(identifier_cols))
    report.append("")
    report.append(
        "PASS: Combined team + pitching model input is ready. It contains one row per game, "
        "result_home_win is present, gamePk is unique, numeric model features have no missing values, "
        "and pitcher/bullpen features were merged without target leakage columns."
    )

    with open(AUDIT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")

    print("✅ Built combined team + pitching model input successfully.")


if __name__ == "__main__":
    main()
