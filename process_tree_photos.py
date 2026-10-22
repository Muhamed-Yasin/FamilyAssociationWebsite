import os
import cv2
from PIL import Image
from ruamel.yaml import YAML

INPUT_DIR = os.path.join("images", "input")
OUTPUT_DIR = os.path.join("images", "familytree")
YAML_PATH = os.path.join("data", "familytree.yml")

def find_and_update_person(person, target_name, new_image_path):
    """Recursively searches the family tree and updates the image path by ID or Name."""
    updated = False
    target_lower = target_name.lower()

    # 1. Check the main person
    person_id = person.get('id', '').lower()
    main_name = person.get('name', '').lower()
    alt_names = [name.lower() for name in person.get('alt_names', [])]
    
    # Match by ID if it exists, otherwise fall back to matching by name
    if (person_id == target_lower) or (target_lower == main_name or target_lower in alt_names):
        person['image'] = new_image_path
        updated = True

    # 2. Check the spouse
    if 'spouse' in person and person['spouse']:
        spouse_data = person['spouse']
        
        if isinstance(spouse_data, str):
            if spouse_data.lower() == target_lower:
                person['spouse'] = {'name': spouse_data, 'image': new_image_path}
                updated = True
                
        elif isinstance(spouse_data, dict):
            spouse_id = spouse_data.get('id', '').lower()
            spouse_name = spouse_data.get('name', '').lower()
            spouse_alts = [name.lower() for name in spouse_data.get('alt_names', [])]
            
            if (spouse_id == target_lower) or (target_lower == spouse_name or target_lower in spouse_alts):
                person['spouse']['image'] = new_image_path
                updated = True

    # 3. Recursively check children
    if 'children' in person and person['children']:
        for child in person['children']:
            if find_and_update_person(child, target_name, new_image_path):
                updated = True

    return updated

def process_photos_and_update_yaml(target_size=200, padding_factor=2.0):
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Initialize ruamel.yaml to preserve formatting/order
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.indent(mapping=2, sequence=4, offset=2)

    try:
        with open(YAML_PATH, 'r', encoding='utf-8') as file:
            tree_data = yaml.load(file)
    except Exception as e:
        print(f"Error reading YAML file: {e}")
        return

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
    
    changes_made = False

    for filename in os.listdir(INPUT_DIR):
        ext = os.path.splitext(filename)[1].lower()
        if ext not in valid_extensions:
            continue

        person_name = os.path.splitext(filename)[0] # e.g., "Muhamed Yasin"
        input_path = os.path.join(INPUT_DIR, filename)
        
        output_filename = f"{person_name}.jpg"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # The path as it needs to be written in the YAML file (using forward slashes for the web)
        yaml_image_path = f"images/familytree/{output_filename}"

        try:
            # --- IMAGE PROCESSING ---
            img_cv = cv2.imread(input_path)
            if img_cv is None:
                continue
            
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            with Image.open(input_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img_width, img_height = img.size

                if len(faces) > 0:
                    faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)
                    x, y, w, h = faces[0]
                    cx, cy = x + w // 2, y + h // 2
                    
                    crop_size = min(int(max(w, h) * padding_factor), img_width, img_height)
                    left, top = max(0, cx - crop_size // 2), max(0, cy - crop_size // 2)
                    right, bottom = min(img_width, left + crop_size), min(img_height, top + crop_size)
                    
                    # Readjust if it hit the right/bottom borders
                    if right - left < crop_size: left = max(0, right - crop_size)
                    if bottom - top < crop_size: top = max(0, bottom - crop_size)
                else:
                    min_dim = min(img_width, img_height)
                    left, top = (img_width - min_dim) / 2, (img_height - min_dim) / 2
                    right, bottom = left + min_dim, top + min_dim

                img_cropped = img.crop((left, top, right, bottom))
                img_resized = img_cropped.resize((target_size, target_size), Image.Resampling.LANCZOS)
                img_resized.save(output_path, format="JPEG", quality=85)
            
            # --- YAML UPDATING ---
            if find_and_update_person(tree_data, person_name, yaml_image_path):
                print(f"✅ Processed {filename} and updated YAML for '{person_name}'.")
                changes_made = True
            else:
                print(f"⚠️ Processed {filename} but couldn't find '{person_name}' in familytree.yml.")

        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")

    # Save the updated YAML back to the file if changes were made
    if changes_made:
        with open(YAML_PATH, 'w', encoding='utf-8') as file:
            yaml.dump(tree_data, file)
        print("\nAll changes successfully saved to data/familytree.yml!")

if __name__ == "__main__":
    print("Starting photo processing and YAML integration...\n")
    process_photos_and_update_yaml()