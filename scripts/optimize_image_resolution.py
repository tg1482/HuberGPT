import os
from PIL import Image

def compress_image(input_image_path, output_image_path, quality=60):
    with Image.open(input_image_path) as img:
        img.save(output_image_path, "JPEG", quality=quality)

def optimize_images_in_directory(directory, output_directory):
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    for filename in os.listdir(directory):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            input_image_path = os.path.join(directory, filename)
            output_image_path = os.path.join(output_directory, filename)
            compress_image(input_image_path, output_image_path)

if __name__ == "__main__":
    input_directory = "../public"
    output_directory = "../optimized_public"
    optimize_images_in_directory(input_directory, output_directory)
    print(f"Images have been optimized and saved in {output_directory}")
