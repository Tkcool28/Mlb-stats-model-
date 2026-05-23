import os
import json

data_dir = "./src/data"
split_files = sorted([f for f in os.listdir(data_dir) if (f.startswith("mlb_games_") and f.endswith(".json"))])

all_games = []
for f_name in split_files:
    with open(os.path.join(data_dir, f_name), "r", encoding="utf-8") as f_split:
        all_games.extend(json.load(f_split))

starters = set()
for g in all_games:
    date_str = g.get("date") or g.get("d") or ""
    season = date_str[:4]
    
    home_id = g.get("homeStarterId")
    away_id = g.get("awayStarterId")
    
    if home_id:
        starters.add((season, home_id))
    if away_id:
        starters.add((season, away_id))

print(f"Total games loaded: {len(all_games)}")
print(f"Total unique (season, pitcher_id) starting matches: {len(starters)}")
