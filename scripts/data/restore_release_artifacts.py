import argparse, json, hashlib, gzip, shutil, zipfile, csv
from pathlib import Path
from urllib.request import urlretrieve

MANIFEST=Path('release_artifacts_manifest_2010_2025.json')


def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for c in iter(lambda:f.read(1<<20),b''): h.update(c)
    return h.hexdigest()

def csv_shape(path):
    opener=gzip.open if str(path).endswith('.gz') else open
    with opener(path,'rt',newline='') as f:
        r=csv.reader(f); hdr=next(r); n=sum(1 for _ in r)
    return n,len(hdr)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--release-url')
    ap.add_argument('--local-artifacts-dir',default='artifacts/release')
    args=ap.parse_args()

    manifest=json.loads(MANIFEST.read_text())['artifacts']
    adir=Path(args.local_artifacts_dir)
    adir.mkdir(parents=True,exist_ok=True)

    for a in manifest:
        p=adir/a['filename']
        if not p.exists() and args.release_url:
            url=args.release_url.rstrip('/')+'/'+a['filename']
            urlretrieve(url,p)
        if not p.exists():
            raise SystemExit(f"Missing artifact: {p}")
        if sha256(p)!=a['sha256']:
            raise SystemExit(f"Checksum mismatch: {p}")

    with zipfile.ZipFile(adir/'raw_games_2010_2025.zip') as z:
        z.extractall('.')

    Path('data/processed/team').mkdir(parents=True,exist_ok=True)
    Path('data/processed/pitching').mkdir(parents=True,exist_ok=True)
    Path('data/processed/model_inputs').mkdir(parents=True,exist_ok=True)

    with gzip.open(adir/'processed_team_features_2010_2025.csv.gz','rb') as fi, open('data/processed/team/pregame_features_2010_2025.csv','wb') as fo: shutil.copyfileobj(fi,fo)
    shutil.copy2(adir/'pitching_features_export_2010_2025.csv.gz','data/processed/pitching/pitching_features_export_2010_2025.csv.gz')
    with gzip.open(adir/'model_input_team_pitching_2010_2025.csv.gz','rb') as fi, open('data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv','wb') as fo: shutil.copyfileobj(fi,fo)

    team_rows,_=csv_shape('data/processed/team/pregame_features_2010_2025.csv')
    pit_rows,_=csv_shape('data/processed/pitching/pitching_features_export_2010_2025.csv.gz')
    comb_rows,comb_cols=csv_shape('data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv')

    ok=(team_rows==37340 and pit_rows==37340 and comb_rows==37340 and comb_cols==134)
    print(f"team_rows={team_rows} pitching_rows={pit_rows} combined_rows={comb_rows} combined_cols={comb_cols}")
    print('PASS' if ok else 'FAIL')
    if not ok:
        raise SystemExit(1)

if __name__=='__main__':
    main()
