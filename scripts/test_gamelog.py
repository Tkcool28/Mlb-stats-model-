import urllib.request
import json

player_id = 453286 # Max Scherzer
season = 2023
url = f"https://statsapi.mlb.com/api/v1/people/{player_id}/stats?stats=gameLog&group=pitching&season={season}"

try:
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode("utf-8"))
    
    stats_group = data.get("stats", [])
    if len(stats_group) > 0:
        gamelogs = stats_group[0].get("splits", [])
        print(f"Loaded {len(gamelogs)} game logs for player {player_id}")
        if len(gamelogs) > 0:
            first_log = gamelogs[0]
            print("Game date:", first_log.get("date"))
            print("Game object:", first_log.get("game"))
            print("Is Starter:", first_log.get("stat", {}).get("gamesStarted"))
            print("Innings Pitched:", first_log.get("stat", {}).get("inningsPitched"))
            print("Strikeouts:", first_log.get("stat", {}).get("strikeOuts"))
            print("Base on Balls:", first_log.get("stat", {}).get("baseOnBalls"))
            print("Earned Runs:", first_log.get("stat", {}).get("earnedRuns"))
            print("Home Runs:", first_log.get("stat", {}).get("homeRuns"))
            print("Batters faced:", first_log.get("stat", {}).get("battersFaced"))
            print("Hit batsmen:", first_log.get("stat", {}).get("hitBatsmen"))
            print("Opponent/Game info keys:", sorted(first_log.keys()))
            print("Full stats keys in gameLog:", sorted(first_log.get("stat", {}).keys()))
    else:
        print("No stats field in response")
except Exception as e:
    print("Error:", e)
