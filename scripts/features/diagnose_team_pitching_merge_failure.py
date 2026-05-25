import pandas as pd
from pathlib import Path

TEAM_PATH = Path('data/processed/team/pregame_features_2010_2025.csv')
PITCH_PATH = Path('data/processed/pitching/pitching_features_export_2010_2025.csv.gz')
OUT_PATH = Path('reports/model_inputs/team_pitching_merge_failure_diagnosis.md')
TARGET_GAMEPK = 265778


def by_season(df):
    g = df.groupby('season', dropna=False)
    out = []
    for season, part in g:
        out.append((season, len(part), str(part['date'].min()) if 'date' in part else 'n/a', str(part['date'].max()) if 'date' in part else 'n/a'))
    return out


def fmt_table(rows, headers):
    lines = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    for r in rows:
        lines.append("| " + " | ".join(map(str, r)) + " |")
    return lines


def main():
    team = pd.read_csv(TEAM_PATH)
    pitch = pd.read_csv(PITCH_PATH, compression='gzip')

    team_keys = set(team['gamePk'].dropna().astype(int).tolist())
    pitch_keys = set(pitch['gamePk'].dropna().astype(int).tolist())

    team_missing_req = {
        'gamePk': int(team['gamePk'].isna().sum()),
        'date': int(team['date'].isna().sum()),
        'season': int(team['season'].isna().sum()),
        'home_team': int(team['home_team'].isna().sum()),
        'away_team': int(team['away_team'].isna().sum()),
        'result_home_win': int(team['result_home_win'].isna().sum()),
    }

    team_rows = by_season(team)
    pitch_rows = by_season(pitch)

    seasons = sorted(set(team['season'].dropna().tolist()) | set(pitch['season'].dropna().tolist()))
    comp_rows = []
    for s in seasons:
        t = team[team['season'] == s]
        p = pitch[pitch['season'] == s]
        tk = set(t['gamePk'].dropna().astype(int).tolist())
        pk = set(p['gamePk'].dropna().astype(int).tolist())
        comp_rows.append((s, len(t), len(p), len(tk & pk), len(tk - pk), len(pk - tk)))

    target_team = team[team['gamePk'] == TARGET_GAMEPK]
    target_pitch = pitch[pitch['gamePk'] == TARGET_GAMEPK]

    team_seasons_sorted = sorted(team['season'].dropna().unique().tolist())
    pitch_seasons_sorted = sorted(pitch['season'].dropna().unique().tolist())

    lines = []
    lines.append('# Team + Pitching Merge Failure Diagnosis')
    lines.append('')
    lines.append('## Inputs')
    lines.append(f'- Team file: `{TEAM_PATH}`')
    lines.append(f'- Pitching file: `{PITCH_PATH}`')
    lines.append('')
    lines.append('## Team file checks')
    lines.append(f'- Row count: {len(team)}')
    lines.append(f'- Duplicate gamePk count: {int(team["gamePk"].duplicated().sum())}')
    lines.append(f'- Missing gamePk count: {int(team["gamePk"].isna().sum())}')
    lines.append('- Missing required field counts:')
    for k, v in team_missing_req.items():
        lines.append(f'  - {k}: {v}')
    lines.append(f'- Seasons present: {team_seasons_sorted}')
    lines.append(f'- Team season count: {len(team_seasons_sorted)}')
    lines.append('')
    lines.append('### Team row count and date range by season')
    lines.extend(fmt_table(team_rows, ['season', 'row_count', 'min_date', 'max_date']))
    lines.append('')

    lines.append('## Pitching file checks')
    lines.append(f'- Row count: {len(pitch)}')
    lines.append(f'- Duplicate gamePk count: {int(pitch["gamePk"].duplicated().sum())}')
    lines.append(f'- Missing gamePk count: {int(pitch["gamePk"].isna().sum())}')
    lines.append(f'- Seasons present: {pitch_seasons_sorted[:5]} ... {pitch_seasons_sorted[-5:]}')
    lines.append(f'- Pitching season count: {len(pitch_seasons_sorted)}')
    lines.append('')
    lines.append('### Pitching row count and date range by season')
    lines.extend(fmt_table(pitch_rows, ['season', 'row_count', 'min_date', 'max_date']))
    lines.append('')

    lines.append('## Team vs pitching by season (gamePk overlap)')
    lines.extend(fmt_table(comp_rows, ['season', 'team_rows', 'pitching_rows', 'overlap_count', 'unmatched_team', 'unmatched_pitching']))
    lines.append('')

    lines.append('## gamePk 265778 investigation')
    lines.append(f'- Present in team file: {not target_team.empty}')
    if not target_team.empty:
        r = target_team.iloc[0]
        lines.append(f"- Team row: date={r['date']}, season={r['season']}, home_team={r['home_team']}, away_team={r['away_team']}, result_home_win={r['result_home_win']}")
    lines.append(f'- Present in pitching file: {not target_pitch.empty}')
    lines.append('- Merge failure reason: inner merge drops this gamePk because it is in team but absent in pitching.')
    lines.append('')

    lines.append('## Coverage assessment')
    lines.append('- Team file is not a full 2010–2025 table; it only contains seasons 2010–2014 and 2014 is partial.')
    lines.append('- Pitching file spans 2010–2025 and contains many gamePk outside team-file coverage, causing large unmatched_pitching counts.')
    lines.append('- Team rows (~10k) look like a modeling subset compared to full-game history in pitching (~37k).')
    lines.append('')

    lines.append('## Recommendation')
    lines.append('- Regenerate team pregame features for full 2010–2025 coverage using the same game universe as pitching export, then rerun strict merge audit. Do not force PASS until row-loss is truly resolved.')

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Wrote {OUT_PATH}')


if __name__ == '__main__':
    main()
