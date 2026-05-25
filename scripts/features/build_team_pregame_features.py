import json
from pathlib import Path
from collections import defaultdict, deque
import pandas as pd

SRC_GLOB = 'src/data/mlb_games_*.json'
RAW_OUT_DIR = Path('data/raw/games')
TEAM_OUT = Path('data/processed/team/pregame_features_2010_2025.csv')
AUDIT_OUT = Path('reports/team/team_pregame_feature_audit_2010_2025.md')
COVERAGE_AUDIT_OUT = Path('reports/model_inputs/team_vs_pitching_coverage_audit_2010_2025.md')
PITCHING_PATH = Path('data/processed/pitching/pitching_features_export_2010_2025.csv.gz')


def norm_game(g):
    gamepk = g.get('gamePk') or g.get('pk')
    date = g.get('date') or g.get('d')
    home = g.get('homeAbbr') or g.get('h')
    away = g.get('awayAbbr') or g.get('a')
    hs = g.get('homeScore') if g.get('homeScore') is not None else g.get('hs')
    a_s = g.get('awayScore') if g.get('awayScore') is not None else g.get('as')
    if gamepk is None or not date or not home or not away or hs is None or a_s is None:
        return None
    return {
        'gamePk': int(gamepk),
        'date': str(date)[:10],
        'season': int(str(date)[:4]),
        'home_team': home,
        'away_team': away,
        'home_score': int(hs),
        'away_score': int(a_s),
    }


def build():
    RAW_OUT_DIR.mkdir(parents=True, exist_ok=True)
    TEAM_OUT.parent.mkdir(parents=True, exist_ok=True)
    AUDIT_OUT.parent.mkdir(parents=True, exist_ok=True)
    COVERAGE_AUDIT_OUT.parent.mkdir(parents=True, exist_ok=True)

    pitch = pd.read_csv(PITCHING_PATH, compression='gzip', usecols=['gamePk'])
    pitch_gamepk = set(pitch['gamePk'].astype(int).tolist())

    games = []
    raw_counts = {}
    for p in sorted(Path('src/data').glob('mlb_games_*.json')):
        season = int(p.stem.split('_')[-1])
        data = json.loads(p.read_text())
        out = []
        for g in data:
            ng = norm_game(g)
            if ng is not None:
                out.append(ng)
        raw_counts[season] = len(out)
        Path(RAW_OUT_DIR / f'mlb_games_{season}.json').write_text(json.dumps(out))
        games.extend(out)

    # restrict to pitching universe for aligned coverage
    filtered = [g for g in games if g['gamePk'] in pitch_gamepk]
    by_pk = {}
    for g in filtered:
        by_pk[g['gamePk']] = g
    games = list(by_pk.values())
    games.sort(key=lambda x: (x['date'], x['gamePk']))

    hist = defaultdict(lambda: {'gp':0,'w':0,'rs':0,'ra':0,'last10':deque(maxlen=10),'last_date':None,'streak':0})
    rows = []
    fallback_counts = defaultdict(int)

    for g in games:
        home, away = g['home_team'], g['away_team']
        hs, as_ = g['home_score'], g['away_score']
        date = pd.to_datetime(g['date'])
        h = hist[(g['season'], home)]
        a = hist[(g['season'], away)]

        def pre(s):
            gp=s['gp']
            if gp==0:
                return dict(gp=0,wp=0.5,rd=0.0,rs=0.0,ra=0.0,l10w=0.5,l10rd=0.0,streak=0,rest=0,fb=True)
            l10=list(s['last10'])
            lw=sum(1 for w,_ in l10 if w)
            lrd=sum(rd for _,rd in l10)
            return dict(gp=gp,wp=s['w']/gp,rd=(s['rs']-s['ra'])/gp,rs=s['rs']/gp,ra=s['ra']/gp,l10w=lw/len(l10),l10rd=lrd/len(l10),streak=s['streak'],rest=0 if s['last_date'] is None else (date - s['last_date']).days,fb=False)

        hp=pre(h); ap=pre(a)
        if hp['fb']: fallback_counts[g['season']] += 1
        if ap['fb']: fallback_counts[g['season']] += 1

        rows.append({
            'gamePk':g['gamePk'],'date':g['date'],'season':g['season'],'home_team':home,'away_team':away,
            'result_home_win':1 if hs>as_ else 0,
            'home_games_played_to_date':hp['gp'],'away_games_played_to_date':ap['gp'],
            'home_win_pct_pre_game':hp['wp'],'away_win_pct_pre_game':ap['wp'],
            'home_run_diff_per_game_pre_game':hp['rd'],'away_run_diff_per_game_pre_game':ap['rd'],
            'home_runs_scored_per_game_pre_game':hp['rs'],'away_runs_scored_per_game_pre_game':ap['rs'],
            'home_runs_allowed_per_game_pre_game':hp['ra'],'away_runs_allowed_per_game_pre_game':ap['ra'],
            'home_last_10_win_pct':hp['l10w'],'away_last_10_win_pct':ap['l10w'],
            'home_last_10_run_diff_per_game':hp['l10rd'],'away_last_10_run_diff_per_game':ap['l10rd'],
            'home_field_flag':1,
            'home_current_win_streak_pre_game':hp['streak'],'away_current_win_streak_pre_game':ap['streak'],
            'home_rest_days':hp['rest'],'away_rest_days':ap['rest'],
            'home_used_fallback':hp['fb'],'away_used_fallback':ap['fb'],
            'home_last_source_date':None if h['last_date'] is None else str(h['last_date'].date()),
            'away_last_source_date':None if a['last_date'] is None else str(a['last_date'].date()),
        })

        hwin = hs>as_
        awin = as_>hs
        # update after row write
        for s,win,rs,ra in ((h,hwin,hs,as_),(a,awin,as_,hs)):
            s['gp']+=1; s['w']+=1 if win else 0; s['rs']+=rs; s['ra']+=ra
            s['last10'].append((1 if win else 0, rs-ra))
            if win: s['streak']=s['streak']+1 if s['streak']>=0 else 1
            else: s['streak']=s['streak']-1 if s['streak']<=0 else -1
            s['last_date']=date

    df = pd.DataFrame(rows)
    df.to_csv(TEAM_OUT,index=False)

    # audits
    req=['gamePk','date','season','home_team','away_team','result_home_win']
    num_missing = int(df.select_dtypes(include=['number']).isna().sum().sum())
    miss={c:int(df[c].isna().sum()) for c in req}
    bys=df.groupby('season').agg(row_count=('gamePk','size'),min_date=('date','min'),max_date=('date','max')).reset_index()
    raw_bys=sorted(raw_counts.items())

    # leakage checks sample
    def first2(team, season):
        s=df[((df.home_team==team)|(df.away_team==team))&(df.season==season)].sort_values(['date','gamePk']).head(2)
        vals=[]
        for _,r in s.iterrows():
            is_home=r['home_team']==team
            vals.append((int(r['gamePk']),r['date'], int(r['home_games_played_to_date'] if is_home else r['away_games_played_to_date'])))
        return vals
    t2010=df[df.season==2010].iloc[0]['home_team']
    t2025=df[df.season==2025].iloc[0]['home_team']
    samp2010=first2(t2010,2010); samp2025=first2(t2025,2025)
    b2b=df.sort_values(['home_team','date']).groupby('home_team').head(2).head(1)
    leak_ok=((pd.to_datetime(df['home_last_source_date'],errors='coerce') < pd.to_datetime(df['date'])).fillna(True) & (pd.to_datetime(df['away_last_source_date'],errors='coerce') < pd.to_datetime(df['date'])).fillna(True)).all()

    lines=['# Team Pregame Feature Audit (2010-2025)','',f'- Output: `{TEAM_OUT}`',f'- Raw source dir: `{RAW_OUT_DIR}`','', '## Raw games by season']
    for s,c in raw_bys: lines.append(f'- {s}: {c}')
    lines += ['','## Processed team feature rows by season']
    for _,r in bys.iterrows(): lines.append(f"- {int(r['season'])}: {int(r['row_count'])} ({r['min_date']} to {r['max_date']})")
    lines += ['',f"- Duplicate gamePk count: {int(df['gamePk'].duplicated().sum())}",f"- Missing gamePk count: {int(df['gamePk'].isna().sum())}",'- Missing required field counts:']
    for k,v in miss.items(): lines.append(f'  - {k}: {v}')
    lines += [f'- Missing numeric feature count: {num_missing}','- First-game fallback counts by season (home+away flags):']
    for s in sorted(fallback_counts): lines.append(f'- {s}: {fallback_counts[s]}')
    lines += ['','## Leakage checks',f'- 2010 sample team: {t2010}, first two games (gamePk,date,games_played_to_date): {samp2010}',f'- 2025 sample team: {t2025}, first two games (gamePk,date,games_played_to_date): {samp2025}',f'- Back-to-back example row gamePk: {int(b2b.iloc[0]["gamePk"])}',f'- Automated check last_source_date < current date: {"PASS" if leak_ok else "FAIL"}']
    AUDIT_OUT.write_text('\n'.join(lines)+'\n')

    # coverage audit
    team=df
    pitch_full=pd.read_csv(PITCHING_PATH,compression='gzip',usecols=['gamePk','season'])
    seasons=sorted(set(team.season.unique())|set(pitch_full.season.unique()))
    out=['# Team vs Pitching Coverage Audit (2010-2025)','',f'- Team: `{TEAM_OUT}`',f'- Pitching: `{PITCHING_PATH}`','', '| season | team_row_count | pitching_row_count | overlap_gamePk | unmatched_team | unmatched_pitching |','|---|---:|---:|---:|---:|---:|']
    for s in seasons:
        t=team[team.season==s]; p=pitch_full[pitch_full.season==s]
        tk=set(t.gamePk.astype(int)); pk=set(p.gamePk.astype(int))
        out.append(f'| {s} | {len(t)} | {len(p)} | {len(tk&pk)} | {len(tk-pk)} | {len(pk-tk)} |')
    out.append('')
    if 265778 in set(team.gamePk.astype(int)):
        out.append('- gamePk 265778 is present in rebuilt team file.')
    else:
        out.append('- gamePk 265778 is NOT present in rebuilt team file (old bad row not carried forward).')
    COVERAGE_AUDIT_OUT.write_text('\n'.join(out)+'\n')

if __name__=='__main__':
    build()
