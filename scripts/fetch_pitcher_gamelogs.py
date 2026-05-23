import os
import json
import urllib.request
import concurrent.futures
import time

def fetch_gamelog(item):
    season, pid = item
    cache_dir = "./.cache/gamelogs"
    cache_path = os.path.join(cache_dir, f"{season}_{pid}.json")
    
    if os.path.exists(cache_path):
        # Already cached, quick check of validity
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                json.load(f)
            return "cached"
        except Exception:
            pass # Re-download if corrupted
        
    url = f"https://statsapi.mlb.com/api/v1/people/{pid}/stats?stats=gameLog&group=pitching&season={season}"
    max_retries = 3
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode("utf-8"))
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(data, f)
            return "fetched"
        except Exception as e:
            if attempt == max_retries - 1:
                # Cache an empty fallback on absolute permanent failure to prevent infinite retries later
                fallback_data = {"stats": []}
                try:
                    with open(cache_path, "w", encoding="utf-8") as f:
                        json.dump(fallback_data, f)
                except Exception:
                    pass
                return f"failed: {e}"
            time.sleep(1)

def main():
    print("======================================================================")
    print("⚾️ BULK DOWNLOADING ALL starting pitcher GAMELOGS (2010-2025) ⚾️")
    print("======================================================================")
    
    data_dir = "./src/data"
    cache_dir = "./.cache/gamelogs"
    os.makedirs(cache_dir, exist_ok=True)
    
    split_files = sorted([f for f in os.listdir(data_dir) if (f.startswith("mlb_games_") and f.endswith(".json"))])
    
    all_games = []
    for f_name in split_files:
        with open(os.path.join(data_dir, f_name), "r", encoding="utf-8") as f_split:
            all_games.extend(json.load(f_split))
            
    starters = set()
    for g in all_games:
        date_str = g.get("date") or g.get("d") or ""
        season = date_str[:4]
        h_id = g.get("homeStarterId")
        a_id = g.get("awayStarterId")
        if h_id:
            starters.add((season, h_id))
        if a_id:
            starters.add((season, a_id))
            
    starters_list = sorted(list(starters))
    total = len(starters_list)
    print(f"Total unique (season, pitcher_id) starting matches to load: {total}")
    
    start_time = time.time()
    completed = 0
    cnt_cached = 0
    cnt_fetched = 0
    cnt_failed = 0
    
    # Process in chunks or direct executor map
    print("Initiating full multi-threaded down loader (40 concurrent workers)...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=40) as executor:
        # We can map and process results as they come
        future_to_starter = {executor.submit(fetch_gamelog, starter): starter for starter in starters_list}
        
        for future in concurrent.futures.as_completed(future_to_starter):
            res = future.result()
            completed += 1
            if res == "cached":
                cnt_cached += 1
            elif res == "fetched":
                cnt_fetched += 1
            else:
                cnt_failed += 1
                
            if completed % 500 == 0 or completed == total:
                elapsed = time.time() - start_time
                speed = completed / elapsed if elapsed > 0 else 0
                print(f"[{completed}/{total}] {completed/total*100:.1f}% Done. "
                      f"Cached: {cnt_cached}, Fetched: {cnt_fetched}, Failed: {cnt_failed}. "
                      f"Elapsed: {elapsed:.1f}s, Speed: {speed:.1f} req/s")
                      
    total_elapsed = time.time() - start_time
    print("\n✓ BULK DOWNLOAD COMPLETE!")
    print(f"Total time elapsed: {total_elapsed:.2f} seconds.")
    print(f"Final Count - Cached: {cnt_cached}, Fetched: {cnt_fetched}, Failed: {cnt_failed}")

if __name__ == "__main__":
    main()
