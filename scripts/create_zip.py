import os
import zipfile
import sys

def create_zip_archive():
    print("Starting compression process of season-split games data...")
    archive_name = "mlb_data_export.zip"
    
    # Locate all split games season files
    data_dir = "src/data"
    if not os.path.exists(data_dir):
        print(f"❌ Error: Data directory {data_dir} does not exist!")
        sys.exit(1)
        
    files_to_compress = sorted([
        os.path.join(data_dir, f) 
        for f in os.listdir(data_dir) 
        if f.startswith("mlb_games_") and f.endswith(".json")
    ])
    
    if not files_to_compress:
        print("❌ Error: No season-split games files found inside src/data!")
        sys.exit(1)
    
    print(f"Found {len(files_to_compress)} split season game files to compress:")
    for f in files_to_compress:
        print(f"✓ Found: {f} (Size: {os.path.getsize(f)} bytes)")
            
    try:
        with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in files_to_compress:
                # Add file to zip (under its base file name for clean extraction)
                base_name = os.path.basename(file_path)
                zipf.write(file_path, arcname=base_name)
                print(f"✓ Added {base_name} to zip archive")
        
        print(f"🎉 Zip archive created successfully: {archive_name}")
        print(f"  - Total Size: {os.path.getsize(archive_name)} bytes")
    except Exception as e:
        print(f"❌ Error while creating zip: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_zip_archive()
