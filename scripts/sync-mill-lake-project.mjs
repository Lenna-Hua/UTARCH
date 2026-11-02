import dotenv from "dotenv";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ultra HD 2382x3369 px (300 DPI print quality) exported directly from Canva Pro
const pages = [
  {
    num: 1,
    id: "sheet-01-cover",
    name: "Cover & Title Sheet",
    caption: "Portfolio Cover — Mill Lake Retreat Residential Building",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0001-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T131220Z&X-Amz-Expires=35261&X-Amz-Signature=be75fa9357bb7568839ab363c94199a5b498ccb7a1d4f61f067e1fc162514c58&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A00%3A01%20GMT"
  },
  {
    num: 2,
    id: "sheet-02-introduction-credits",
    name: "Project Intro & Credits",
    caption: "Introduction, Scope of Work, and Team Credits",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0002-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T173611Z&X-Amz-Expires=20584&X-Amz-Signature=534cbbb7f90eaba313a158c419af7fd2f73c6d784896fc3ff2615d8ade387a08&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A19%3A15%20GMT"
  },
  {
    num: 3,
    id: "sheet-03-concept-themes",
    name: "Architectural Themes",
    caption: "Residential, Creativity, Sustainability",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0003-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T191846Z&X-Amz-Expires=14779&X-Amz-Signature=f8645c6307d7894773c808eeb5202eca2f2c93a697f0db1ad9cebb5e8e1d0d5f&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A25%3A05%20GMT"
  },
  {
    num: 4,
    id: "sheet-04-site-plan",
    name: "Site Plan (2025)",
    caption: "Site Plan following natural shoreline and Canadian Shield rock outcroppings",
    kind: "drawing",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0004-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T084123Z&X-Amz-Expires=49908&X-Amz-Signature=a0dc9f547278d2ebeace25502a962824acc8b138ae8154503aec8c44a4dd9aa7&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A33%3A11%20GMT"
  },
  {
    num: 5,
    id: "sheet-05-floor-plans",
    name: "Floor Plans (Main & Second Level)",
    caption: "Main floor social core and second floor multi-generational suites",
    kind: "drawing",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0005-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T021803Z&X-Amz-Expires=76028&X-Amz-Signature=2a4d2eff5157ff43ab0346cf0b46c4cb728164f29cfd5a089a48c1abe05ca2b5&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A25%3A11%20GMT"
  },
  {
    num: 6,
    id: "sheet-06-elevations-sections",
    name: "Elevations & Building Sections",
    caption: "Front and back elevations, long and short building sections",
    kind: "drawing",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0006-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T212628Z&X-Amz-Expires=3974&X-Amz-Signature=cccdd726f5a1ac9abf8543efe60192080b674bd56824dc0ae6df8319225e920b&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A32%3A42%20GMT"
  },
  {
    num: 7,
    id: "sheet-07-sustainability",
    name: "Sustainability & Passive Strategy",
    caption: "Passive solar design, high-performance thermal envelope, all-electric systems",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0007-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T161101Z&X-Amz-Expires=25838&X-Amz-Signature=17bf13e9b033fb1ea42da04bce729d8ceb4b51aace17332c2ea3d9a6349ec2cc&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A21%3A39%20GMT"
  },
  {
    num: 8,
    id: "sheet-08-construction-details",
    name: "Construction & ICF Foundation",
    caption: "ICF Foundation construction and engineered roof overhangs",
    kind: "drawing",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0008-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T102542Z&X-Amz-Expires=44850&X-Amz-Signature=27b57157bfdcd8b10a1e8eaaa2b8609951fcc5b4bc0aade8010505c742d510d8&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A53%3A12%20GMT"
  },
  {
    num: 9,
    id: "sheet-09-north-lake-facade",
    name: "North Lake-Facing Façade",
    caption: "Continuous glazing connects interior living spaces to water and forest",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0009-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T080906Z&X-Amz-Expires=52207&X-Amz-Signature=951abf3dde13e95db18d659c23dfd7ece411a450af990b31ff74f241327e9ff7&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A39%3A13%20GMT"
  },
  {
    num: 10,
    id: "sheet-10-kitchen-interior",
    name: "Kitchen Interior",
    caption: "Open-concept kitchen integrated with dining and living areas facing lake",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0010-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T005308Z&X-Amz-Expires=80129&X-Amz-Signature=520242c06f01204ffd1b4481db59f3f9be4992268af0754e459ba68c55d6279f&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A08%3A37%20GMT"
  },
  {
    num: 11,
    id: "sheet-11-living-spaces",
    name: "Interior Living Spaces",
    caption: "Living area oriented toward lake with generous daylight and views",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0011-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T023549Z&X-Amz-Expires=71805&X-Amz-Signature=ef823bd82f88ee251e44cddfc863591ca500e8d6b3c6054109a69a74916bdcfb&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2022%3A32%3A34%20GMT"
  },
  {
    num: 12,
    id: "sheet-12-conclusion",
    name: "Architectural Synthesis & Reflection",
    caption: "A retreat rooted in the Canadian Shield",
    kind: "image",
    url: "https://export-download.canva.com/aHZ5E/DAG-h_aHZ5E/-1/0/0012-8559612044005713608.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQYCGKMUH4R7NKVBA%2F20261102%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261102T191341Z&X-Amz-Expires=14953&X-Amz-Signature=d6ab70a46cc7a29395c4bef60eff24cab0d7372cdfd4e9ed3eb72f9a1bb9c0ea&X-Amz-SignedHeaders=host%3Bx-amz-expected-bucket-owner&response-expires=Mon%2C%2002%20Nov%202026%2023%3A22%3A54%20GMT"
  }
];

async function run() {
  console.log("Uploading Ultra-HD 2382x3369 (300 DPI) Canva sheets to Cloudinary...");
  const uploaded = [];

  for (const page of pages) {
    console.log(`Uploading page ${page.num}: ${page.name}...`);
    try {
      const res = await cloudinary.uploader.upload(page.url, {
        folder: "utarch/mill-lake",
        public_id: page.id,
        overwrite: true,
        invalidate: true,
      });
      uploaded.push({
        ...page,
        cloudinaryUrl: res.secure_url,
        publicId: res.public_id,
        width: res.width,
        height: res.height,
        bytes: res.bytes,
      });
      console.log(`  -> ${res.width}x${res.height} (${(res.bytes / 1024 / 1024).toFixed(2)} MB): ${res.secure_url}`);
    } catch (err) {
      console.error(`Error uploading page ${page.num}:`, err.message);
      throw err;
    }
  }

  const findUrl = (id) => uploaded.find((u) => u.id === id)?.cloudinaryUrl;

  const heroImage = findUrl("sheet-09-north-lake-facade");
  const coverImage = findUrl("sheet-01-cover");

  const plans = [
    { title: "Sheet 01 — Site Plan (2025)", url: findUrl("sheet-04-site-plan") },
    { title: "Sheet 02 — Main & Second Floor Plans", url: findUrl("sheet-05-floor-plans") },
    { title: "Sheet 03 — Elevations & Building Sections", url: findUrl("sheet-06-elevations-sections") },
    { title: "Sheet 04 — Construction & Envelope Detailing", url: findUrl("sheet-08-construction-details") }
  ];

  const galleryImages = [
    findUrl("sheet-09-north-lake-facade"),
    findUrl("sheet-10-kitchen-interior"),
    findUrl("sheet-11-living-spaces"),
    findUrl("sheet-07-sustainability"),
    findUrl("sheet-08-construction-details"),
    findUrl("sheet-03-concept-themes"),
    findUrl("sheet-02-introduction-credits"),
    findUrl("sheet-12-conclusion")
  ];

  const highlightStats = [
    { label: "LOCATION", value: "McDougall, ON" },
    { label: "YEAR", value: "2025" },
    { label: "TYPOLOGY", value: "Multi-Gen Retreat" },
    { label: "ENVELOPE", value: "ICF + All-Electric" }
  ];

  const methodologySteps = [
    {
      title: "Site Planning & Shoreline Alignment",
      description: "The site plan follows the natural edge of the lake, stretching the house along a clear axis so that each room captures a direct view of the water. The main volume runs parallel to the shoreline, while the garage and four-season room step slightly off the line to sit comfortably against the granite Canadian Shield outcroppings."
    },
    {
      title: "Spatial Organization & Floor Plans",
      description: "The main floor is organized around an open-concept kitchen, dining, and living area that forms the social core of the retreat. The primary bedroom is placed at one end for privacy, while the four-season room buffers active spaces. The second floor supports multi-generational living with dedicated bedrooms, shared bathrooms, and a central family room."
    },
    {
      title: "Elevations & Topographical Integration",
      description: "The building form steps with the natural granite slope, featuring an expansive three-storey lake-facing north façade with continuous glazing and a sheltered two-storey south façade anchored into the Canadian Shield."
    },
    {
      title: "Passive Sustainability & High-Performance Envelope",
      description: "Sustainability is achieved through passive solar orientation, an insulated concrete form (ICF) foundation, high-performance thermal insulation, and advanced glazing to minimize heat loss. An all-electric mechanical strategy combines air-source heat pumps and heat recovery ventilation (HRV) for year-round northern climate comfort."
    },
    {
      title: "Construction Durability & Snow Load Engineering",
      description: "The roof structure is engineered for heavy northern snow loads with deep overhangs that direct snow and water away from entrances and walkways, paired with durable timber and masonry detailing suited for long-term family use."
    }
  ];

  const description = `Mill Lake Retreat is a multi-generational residential retreat located on the southern shore of a Northern Ontario lake in McDougall, Ontario, Canada.

The scope of work included full architectural services for a new-build single detached dwelling, encompassing site planning, building design, envelope strategy, and integration of structural and energy-efficient systems.

The project responds to a rugged Canadian Shield landscape through a linear building form aligned with the shoreline, ensuring every principal space engages the lake. Design development balanced spatial clarity, durability, and environmental performance, resulting in a contemporary retreat suited for year-round occupation and long-term family use.

The Canadian Shield terrain sets up key design challenges, with rock outcroppings to the south and a gentle slope down to the lake on the north side. The main volume runs parallel to the shoreline, while the garage and four-season room step slightly off the line to sit naturally against the granite formation.

Project Team & Credits:
• Checked By: Lloyd Hunt Architect
• Architecture Team: Lloyd Hunt Architect, Uyen Ton (Architectural Technologist)
• Client: Wayne Freethy
• Interior Design: Aspen & Ivy Interior Design
• GC / Builder: RBA Projects`;

  const outcomes = `Mill Lake Retreat is a response to its natural setting, shaped by the desire to connect daily living with the lake, the forest, and the rugged Canadian Shield terrain.

Through careful orientation, clear spatial organization, and integrated sustainable strategies, the project creates a contemporary retreat that supports multi-generational living while remaining deeply rooted in its place. Continuous northern glazing establishes an unbroken visual dialogue with the water, while high-performance ICF construction and all-electric systems ensure enduring comfort and resilience through all seasons.`;

  console.log("Updating projects table with Ultra-HD URLs...");
  await pool.query(
    `UPDATE projects SET
      cover_image = $1,
      hero_image = $2,
      gallery_images = $3,
      plans = $4
    WHERE id = 1`,
    [
      coverImage,
      heroImage,
      JSON.stringify(galleryImages),
      JSON.stringify(plans),
    ]
  );

  console.log("Updating project_media records with Ultra-HD URLs...");
  await pool.query(`DELETE FROM project_media WHERE project_id = 1`);

  for (const item of uploaded) {
    await pool.query(
      `INSERT INTO project_media (project_id, kind, url, public_id, original_name, caption)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        1,
        item.kind,
        item.cloudinaryUrl,
        item.publicId,
        `${item.id}.jpg`,
        item.caption
      ]
    );
  }

  console.log("Successfully updated all Mill Lake Retreat media to Ultra-HD!");
}

run()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
