import os
import json

# Path to your album folder
ALBUM_DIR = os.path.join("images", "album")

# Supported media extensions (case-insensitive)
VALID_EXTENSIONS = {
    # Images
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
    # Videos
    ".mp4", ".webm", ".mov", ".mkv"
}

def get_album_media():
    if not os.path.exists(ALBUM_DIR):
        print(f"Directory '{ALBUM_DIR}' does not exist. Creating it now...")
        os.makedirs(ALBUM_DIR, exist_ok=True)
        return []

    # Read directory entries, filtering out subdirectories and hidden files
    media_files = []
    for entry in os.scandir(ALBUM_DIR):
        if entry.is_file():
            _, ext = os.path.splitext(entry.name)
            if ext.lower() in VALID_EXTENSIONS:
                media_files.append(entry.name)

    # Sort filenames alphabetically so ordering is predictable
    media_files.sort(key=lambda s: s.lower())
    return media_files

if __name__ == "__main__":
    files = get_album_media()
    
    # Format array with 4-space indentation
    formatted_json = json.dumps(files, indent=4)
    
    print("\nCopy and paste this into scripts/album.js:\n")
    print(f"const albumImages = {formatted_json};")