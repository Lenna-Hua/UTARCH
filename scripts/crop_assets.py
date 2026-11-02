import os
import urllib.request
from PIL import Image

CROP_DIR = "temp_crops"
os.makedirs(CROP_DIR, exist_ok=True)

# Sources
sources = {
    4: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0004-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T084123Z&X-Amz-Expires=49908&X-Amz-Signature=a0dc9f547278d2ebeace25502a962824acc8b138ae8154503aec8c44a4dd9aa7&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A33%3A11%20GMT",
    5: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0005-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T021803Z&X-Amz-Expires=76028&X-Amz-Signature=2a4d2eff5157ff43ab0346cf0b46c4cb728164f29cfd5a089a48c1abe05ca2b5&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A25%3A11%20GMT",
    6: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0006-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T212628Z&X-Amz-Expires=3974&X-Amz-Signature=cccdd726f5a1ac9abf8543efe60192080b674bd56824dc0ae6df8319225e920b&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A32%3A42%20GMT",
    8: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0008-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T102542Z&X-Amz-Expires=44850&X-Amz-Signature=27b57157bfdcd8b10a1e8eaaa2b8609951fcc5b4bc0aade8010505c742d510d8&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A53%3A12%20GMT",
    9: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0009-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T080906Z&X-Amz-Expires=52207&X-Amz-Signature=951abf3dde13e95db18d659c23dfd7ece411a450af990b31ff74f241327e9ff7&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A39%3A13%20GMT",
    10: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0010-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T005308Z&X-Amz-Expires=80129&X-Amz-Signature=520242c06f01204ffd1b4481db59f3f9be4992268af0754e459ba68c55d6279f&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A08%3A37%20GMT",
    11: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0011-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T023549Z&X-Amz-Expires=71805&X-Amz-Signature=ef823bd82f88ee251e44cddfc863591ca500e8d6b3c6054109a69a74916bdcfb&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A32%3A34%20GMT",
}

print("Downloading full-res sheets...")
images = {}
for p, url in sources.items():
    path = os.path.join(CROP_DIR, f"page_{p}.jpg")
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)
    images[p] = Image.open(path)

W, H = images[4].size
S = W / 794.0

def crop_box(p, left, top, right, bottom, name):
    im = images[p]
    box = (int(left * S), int(top * S), int(right * S), int(bottom * S))
    cropped = im.crop(box)
    out_path = os.path.join(CROP_DIR, f"{name}.jpg")
    cropped.save(out_path, quality=95)
    print(f"Saved {name}: {cropped.size} -> {out_path}")

print("Cropping individual architectural drawings and renders...")

# 1. Site Plan Drawing (top area of page 4 without the bottom slide text)
crop_box(4, 0, 0, 794, 765, "plan-01-site-plan")

# 2. Floor Plans Drawing (middle area of page 5 without title & footer)
crop_box(5, 50, 270, 744, 1030, "plan-02-floor-plans")

# 3. Elevations & Building Sections (page 6 technical drawings)
crop_box(6, 40, 180, 754, 860, "plan-03-elevations-sections")

# 4. Construction Phase Photos (page 8)
# ICF foundation photo
crop_box(8, 410, 100, 760, 625, "photo-icf-foundation")
# Porch structure photo
crop_box(8, 35, 185, 380, 705, "photo-porch-structure")
# Early construction overall
crop_box(8, 35, 740, 760, 1110, "photo-early-construction")

# 5. Exterior Renders (page 9)
# Panoramic lake perspective
crop_box(9, 15, 720, 780, 1115, "render-lake-panoramic")
# North facade main render
crop_box(9, 15, 25, 540, 338, "render-north-facade-main")
# Perspective render
crop_box(9, 250, 370, 780, 695, "render-exterior-perspective")

# 6. Kitchen Interior Renders (page 10)
crop_box(10, 5, 5, 458, 305, "render-kitchen-island")
crop_box(10, 450, 310, 785, 805, "render-kitchen-vertical")
crop_box(10, 5, 805, 458, 1110, "render-kitchen-dining")

# 7. Living Room Interior Renders (page 11)
crop_box(11, 295, 20, 780, 345, "render-living-room-lake-view")
crop_box(11, 295, 400, 780, 725, "render-living-room-fireplace")
crop_box(11, 295, 775, 780, 1100, "render-living-room-seating")

print("All crops completed successfully!")
