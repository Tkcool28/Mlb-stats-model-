import os
import json
import json as json_lib

def split_seasons():
    data_dir = os.path.join(os.getcwd(), 'src/data')
    games_path = os.path.join(data_dir, 'mlb_games.json')
    
    if not os.path.exists(games_path):
        print("❌ Error: mlb_games.json not found!")
        return
        
    print(f"Reading {games_path}...")
    with open(games_path, 'r', encoding='utf-8') as f:
        raw_games = json.load(f)
        
    print(f"Successfully loaded {len(raw_games)} games from file.")
    
    games_by_season = {}
    
    for g in raw_games:
        # Determine season
        date_val = g.get('date', g.get('d', ''))
        season = g.get('season')
        if not season and date_val:
            season = date_val[:4]
        if not season:
            season = 'unknown'
            
        season = str(season)
        
        # Build normalized game properties
        normalized_game = {
            "gamePk": g.get("gamePk", g.get("pk")),
            "season": season,
            "date": date_val,
            "homeTeam": g.get("homeTeam", g.get("ht", g.get("homeAbbr", g.get("h")))),
            "homeAbbr": g.get("homeAbbr", g.get("h")),
            "homeScore": g.get("homeScore", g.get("hs")),
            "awayTeam": g.get("awayTeam", g.get("at", g.get("awayAbbr", g.get("a")))),
            "awayAbbr": g.get("awayAbbr", g.get("a")),
            "awayScore": g.get("awayScore", g.get("as")),
            "homeStarterId": g.get("homeStarterId", g.get("hi")),
            "awayStarterId": g.get("awayStarterId", g.get("ai"))
        }
        
        if season not in games_by_season:
            games_by_season[season] = []
        games_by_season[season].append(normalized_game)
        
    active_seasons = sorted(list(games_by_season.keys()))
    print(f"Detected seasons: {active_seasons}")
    
    for s in active_seasons:
        if s == 'unknown':
            continue
            
        season_games = games_by_season[s]
        filename = f"mlb_games_{s}.json"
        filepath = os.path.join(data_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f_out:
            json.dump(season_games, f_out, indent=2)
            
        file_size_kb = os.path.getsize(filepath) / 1024
        print(f"✓ Created {filename} | Records: {len(season_games)} | Size: {file_size_kb:.2f} KB")
        
    print("🎉 Done splitting seasons into individual files!")

if __name__ == "__main__":
    split_seasons()
