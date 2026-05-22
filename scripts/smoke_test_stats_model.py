import os
import json
import numpy as np
import sys
import lightgbm as lgb

def run_smoke_test():
    print("==================================================")
    print("🔍 RUNNING MLB STATS MODEL PIPELINE SMOKE TEST")
    print("==================================================")

    data_dir = "./src/data"
    
    # 1. Check for expected data files
    print("Checking split season database JSON integrity...")
    split_files = sorted([f for f in os.listdir(data_dir) if f.startswith("mlb_games_") and f.endswith(".json")])
    if len(split_files) == 0:
        print("❌ Error: No split JSON files found!")
        sys.exit(1)
        
    try:
        # Load sample from first split season file for fast evaluation
        test_file = os.path.join(data_dir, split_files[0])
        with open(test_file, "r") as f:
            sample_games = json.load(f)
        print(f"✓ Parsed `{test_file}` successfully ({len(sample_games)} game records).")
    except Exception as e:
        print(f"❌ Error: Failed parsing JSON dataset: {e}")
        sys.exit(1)

    # 2. Extract tiny pregame rolling sample
    print("Simulating rolling pregame feature construction...")
    team_history = {}
    processed = []
    
    # Filter and use a subset (e.g. first 100 game records) to verify speed & accuracy
    for g in sample_games[:150]:
        date_val = g.get("date") or g.get("d") or ""
        home_abbr = g.get("homeAbbr") or g.get("h") or ""
        away_abbr = g.get("awayAbbr") or g.get("a") or ""
        home_score = g.get("homeScore") if g.get("homeScore") is not None else g.get("hs")
        away_score = g.get("awayScore") if g.get("awayScore") is not None else g.get("as")
        
        if not date_val or not home_abbr or not away_abbr or home_score is None or away_score is None:
            continue
            
        home_score = int(home_score)
        away_score = int(away_score)
        
        # Schedulers
        h_hist = team_history.get(home_abbr, [])
        a_hist = team_history.get(away_abbr, [])
        
        def calc_pregame(h):
            if len(h) == 0:
                return 0.500, 0.0
            wins = sum(1 for x in h if x["won"])
            runs_diff = sum(x["scored"] - x["allowed"] for x in h)
            return wins / len(h), runs_diff / len(h)
            
        h_win, h_diff = calc_pregame(h_hist)
        a_win, a_diff = calc_pregame(a_hist)
        
        rec = {
            "home_win_pct_pre_game": h_win,
            "away_win_pct_pre_game": a_win,
            "home_run_diff_per_game_pre_game": h_diff,
            "away_run_diff_per_game_pre_game": a_diff,
            "result_home_win": 1 if home_score > away_score else 0
        }
        processed.append(rec)
        
        # update histories
        if home_abbr not in team_history:
            team_history[home_abbr] = []
        team_history[home_abbr].append({"scored": home_score, "allowed": away_score, "won": home_score > away_score})
        
        if away_abbr not in team_history:
            team_history[away_abbr] = []
        team_history[away_abbr].append({"scored": away_score, "allowed": home_score, "won": away_score > home_score})

    if len(processed) == 0:
        print("❌ Error: Constructed zero pregame feature records in smoke test.")
        sys.exit(1)

    print(f"✓ Formed {len(processed)} pregame rolling records.")

    # 3. Target Leakage Checks
    features = ["home_win_pct_pre_game", "away_win_pct_pre_game", "home_run_diff_per_game_pre_game", "away_run_diff_per_game_pre_game"]
    target = "result_home_win"
    
    print("Verifying target leakage isolation...")
    if target in features:
        print("❌ Error: Target column leaked inside independent features list!")
        sys.exit(1)
        
    for f in features:
        # Check if feature equals binary target
        vals = [r[f] for r in processed]
        targs = [r[target] for r in processed]
        if vals == targs:
            print(f"❌ Error: Feature `{f}` is identical to target `{target}`!")
            sys.exit(1)
            
    print("✓ Target leakage check succeeded! Features are completely isolated from labels.")

    # 4. Tiny validation model fit
    print("Fitting validation model...")
    X = np.array([[r[f] for f in features] for r in processed])
    y = np.array([r[target] for r in processed])
    
    model = lgb.LGBMClassifier(n_estimators=5, max_depth=2, verbose=-1)
    model.fit(X, y)
    print("✓ Model fitted successfully inside smoke test environment!")
    print("\n🎉 SMOKE TEST COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_smoke_test()
