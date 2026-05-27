import argparse
import csv
import gzip
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from urllib.request import urlretrieve

DEFAULT_OWNER = "Tkcool28"
DEFAULT_REPO = "Mlb-stats-model-"
DEFAULT_TAG = "v0.1-data-2010-2025"
REQUIRED = [
    "raw_games_2010_2025.zip",
    "processed_team_features_2010_2025.csv.gz",
    "pitching_features_export_2010_2025.csv.gz",
    "model_input_team_pitching_2010_2025.csv.gz",
    "reports_bundle_2010_2025.zip",
    "release_artifacts_manifest_2010_2025.json",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def csv_shape(path: Path):
    opener = gzip.open if str(path).endswith(".gz") else open
    with opener(path, "rt", newline="") as f:
        r = csv.reader(f)
        header = next(r)
        rows = sum(1 for _ in r)
    return rows, len(header)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--owner", default=DEFAULT_OWNER)
    ap.add_argument("--repo", default=DEFAULT_REPO)
    ap.add_argument("--tag", default=DEFAULT_TAG)
    ap.add_argument("--local-artifacts-dir", default="artifacts/release")
    ap.add_argument("--release-url", default="")
    args = ap.parse_args()

    adir = Path(args.local_artifacts_dir)
    adir.mkdir(parents=True, exist_ok=True)

    base_url = args.release_url.strip() or f"https://github.com/{args.owner}/{args.repo}/releases/download/{args.tag}"

    manifest_path = adir / "release_artifacts_manifest_2010_2025.json"
    if not manifest_path.exists():
        urlretrieve(f"{base_url}/release_artifacts_manifest_2010_2025.json", manifest_path)

    manifest = json.loads(manifest_path.read_text())
    artifacts = manifest.get("artifacts", [])
    by_name = {a["filename"]: a for a in artifacts if "filename" in a}

    for fn in REQUIRED:
        p = adir / fn
        if not p.exists():
            urlretrieve(f"{base_url}/{fn}", p)
        expected = by_name.get(fn, {}).get("sha256")
        if expected:
            got = sha256(p)
            if got != expected:
                raise SystemExit(f"Checksum mismatch for {fn}")

    Path("data/raw/games").mkdir(parents=True, exist_ok=True)
    Path("data/processed/team").mkdir(parents=True, exist_ok=True)
    Path("data/processed/pitching").mkdir(parents=True, exist_ok=True)
    Path("data/processed/model_inputs").mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(adir / "raw_games_2010_2025.zip") as z:
        z.extractall(".")

    with gzip.open(adir / "processed_team_features_2010_2025.csv.gz", "rb") as fi, open(
        "data/processed/team/pregame_features_2010_2025.csv", "wb"
    ) as fo:
        shutil.copyfileobj(fi, fo)

    shutil.copy2(
        adir / "pitching_features_export_2010_2025.csv.gz",
        "data/processed/pitching/pitching_features_export_2010_2025.csv.gz",
    )

    with gzip.open(adir / "model_input_team_pitching_2010_2025.csv.gz", "rb") as fi, open(
        "data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv", "wb"
    ) as fo:
        shutil.copyfileobj(fi, fo)

    team_rows, team_cols = csv_shape(Path("data/processed/team/pregame_features_2010_2025.csv"))
    pit_rows, pit_cols = csv_shape(Path("data/processed/pitching/pitching_features_export_2010_2025.csv.gz"))
    comb_rows, comb_cols = csv_shape(Path("data/processed/model_inputs/pregame_team_pitching_features_2010_2025.csv"))

    with zipfile.ZipFile(adir / "raw_games_2010_2025.zip") as z:
        raw_json_count = len([n for n in z.namelist() if n.endswith(".json")])

    print(
        f"team_rows={team_rows} team_cols={team_cols} pitching_rows={pit_rows} pitching_cols={pit_cols} "
        f"combined_rows={comb_rows} combined_cols={comb_cols} raw_json_count={raw_json_count}"
    )

    ok = (
        (team_rows, team_cols) == (37340, 29)
        and (pit_rows, pit_cols) == (37340, 110)
        and (comb_rows, comb_cols) == (37340, 134)
        and raw_json_count == 16
    )

    if not ok:
        raise SystemExit("FINAL: FAIL")

    print("FINAL: PASS")


if __name__ == "__main__":
    main()
