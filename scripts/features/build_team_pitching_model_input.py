import os
import sys
import pandas as pd

TEAM_PATH = "data/processed/team/pregame_features_2010_2025.csv"
PITCHING_PATH = "data/processed/pitching/pitching_features_export_2010_2025.csv.gz"
OUT_PATH = "data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv"
AUDIT_PATH = "reports/model_inputs/team_pitching_feature_merge_audit_2010_2025.md"

TEAM_REQ = ["gamePk", "date", "season", "home_team", "away_team", "result_home_win"]
PITCH_REQ = ["gamePk", "date", "season", "homeAbbr", "awayAbbr"]


def write_report(lines):
    os.makedirs(os.path.dirname(AUDIT_PATH), exist_ok=True)
    with open(AUDIT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def fail(message, report_lines):
    report_lines.append("")
    report_lines.append(f"FAIL: {message}")
    write_report(report_lines)
    print(f"❌ {message}")
    sys.exit(1)


def main():
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    report = [
        "# Team + Pitching Feature Merge Audit (2010-2025)",
        "",
        "## File paths used",
        f"- Team input: `{TEAM_PATH}`",
        f"- Pitching input: `{PITCHING_PATH}`",
        f"- Combined output: `{OUT_PATH}`",
        f"- Audit report: `{AUDIT_PATH}`",
        "",
    ]

    if not os.path.exists(TEAM_PATH):
        fail(f"Missing team feature file: {TEAM_PATH}", report)
    if not os.path.exists(PITCHING_PATH):
        fail(f"Missing pitching feature file: {PITCHING_PATH}", report)

    team = pd.read_csv(TEAM_PATH)
    pitching = pd.read_csv(PITCHING_PATH, compression="gzip")

    for col in TEAM_REQ:
        if col not in team.columns:
            fail(f"Team file missing required column: {col}", report)
    for col in PITCH_REQ:
        if col not in pitching.columns:
            fail(f"Pitching file missing required column: {col}", report)

    dup_team = int(team["gamePk"].duplicated().sum())
    dup_pitch = int(pitching["gamePk"].duplicated().sum())
    if dup_team:
        fail(f"Team file has duplicate gamePk values: {dup_team}", report)
    if dup_pitch:
        fail(f"Pitching file has duplicate gamePk values: {dup_pitch}", report)

    forbidden_target_tokens = ["result", "target", "home_win", "label", "outcome"]
    leakage_cols = [c for c in pitching.columns if any(tok in c.lower() for tok in forbidden_target_tokens)]
    if leakage_cols:
        fail(f"Pitching file has forbidden target/result columns: {leakage_cols}", report)

    pitch_numeric_missing = int(pitching.select_dtypes(include=["number"]).isna().sum().sum())
    if pitch_numeric_missing != 0:
        fail(f"Pitching numeric feature missing count is {pitch_numeric_missing}, expected 0", report)

    team_keys = set(team["gamePk"])
    pitch_keys = set(pitching["gamePk"])
    unmatched_team = sorted(team_keys - pitch_keys)
    unmatched_pitching = sorted(pitch_keys - team_keys)

    merged = team.merge(pitching, on="gamePk", how="inner", suffixes=("", "_pitching"))
    row_loss = len(team) - len(merged)

    report.extend([
        "## Merge counts",
        f"- Team row count: {len(team)}",
        f"- Pitching row count: {len(pitching)}",
        f"- Merged row count: {len(merged)}",
        f"- Row loss count: {row_loss}",
        f"- Unmatched team gamePk count: {len(unmatched_team)}",
        f"- Unmatched pitching gamePk count: {len(unmatched_pitching)}",
        "",
    ])

    if row_loss > 0:
        missing_by_season = team[team["gamePk"].isin(unmatched_team)].groupby("season").size().to_dict()
        report.append("## Missing team gamePk by season")
        for season, count in missing_by_season.items():
            report.append(f"- {season}: {count}")
        report.append(f"- Missing gamePk sample (max 25): {unmatched_team[:25]}")
        fail("Inner merge row loss detected; stopping per policy.", report)

    dropped_cols = []
    for col in ["date_pitching", "season_pitching", "homeAbbr", "awayAbbr"]:
        if col in merged.columns:
            merged = merged.drop(columns=[col])
            dropped_cols.append(col)

    duplicate_gamepk = int(merged["gamePk"].duplicated().sum())
    if duplicate_gamepk:
        fail(f"Final merged dataset has duplicate gamePk values: {duplicate_gamepk}", report)
    if "result_home_win" not in merged.columns:
        fail("Final merged dataset is missing result_home_win", report)

    missing_target = int(merged["result_home_win"].isna().sum())
    if missing_target:
        fail(f"Final merged dataset has missing target values: {missing_target}", report)

    numeric_missing = int(merged.select_dtypes(include=["number"]).isna().sum().sum())
    if numeric_missing:
        fail(f"Final merged dataset has numeric missing count {numeric_missing}, expected 0", report)

    raw_pitch_cols = [c for c in merged.columns if c.endswith("_x") or c.endswith("_y")]
    if raw_pitch_cols:
        fail(f"Unexpected duplicate-suffix columns detected: {raw_pitch_cols}", report)

    merged.to_csv(OUT_PATH, index=False)

    season_counts = merged.groupby("season").size().to_dict()
    identifier_cols = [c for c in ["gamePk", "date", "season", "home_team", "away_team", "result_home_win", "homeStarterId", "awayStarterId", "homeStarterName", "awayStarterName"] if c in merged.columns]

    report.extend([
        "## Validation",
        f"- Duplicate gamePk count: {duplicate_gamepk}",
        f"- Missing target count: {missing_target}",
        f"- Numeric missing count: {numeric_missing}",
        f"- Columns dropped during merge: {dropped_cols if dropped_cols else 'None'}",
        "",
        "## Final row count by season",
    ])
    for season, count in season_counts.items():
        report.append(f"- {season}: {count}")

    report.extend([
        "",
        f"## Final column count\n- {len(merged.columns)}",
        "",
        "## First 25 columns",
        "- " + ", ".join(merged.columns[:25]),
        "",
        "## Last 25 columns",
        "- " + ", ".join(merged.columns[-25:]),
        "",
        "## Non-feature identifier/audit columns",
        "- " + ", ".join(identifier_cols),
        "",
        "PASS: Combined team + pitching model input is ready. It contains one row per game, result_home_win is present, gamePk is unique, numeric model features have no missing values, and pitcher/bullpen features were merged without target leakage columns.",
    ])

    write_report(report)
    print("✅ Built combined team + pitching model input successfully.")


if __name__ == "__main__":
    main()
