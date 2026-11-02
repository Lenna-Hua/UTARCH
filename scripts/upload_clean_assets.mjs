import dotenv from "dotenv";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

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

const cropDir = "temp_crops";

const filesToUpload = [
  // Architectural Drawings
  { file: "plan-01-site-plan.jpg", id: "drawing-01-site-plan", kind: "drawing", caption: "Site Plan (2025) — Axis aligned with natural shoreline and Canadian Shield outcroppings" },
  { file: "plan-02-floor-plans.jpg", id: "drawing-02-floor-plans", kind: "drawing", caption: "Floor Plans — Main floor social core and second floor multi-generational suites" },
  { file: "plan-03-elevations-sections.jpg", id: "drawing-03-elevations-sections", kind: "drawing", caption: "Elevations & Building Sections — 3-storey lake-facing north façade and stepping terrain sections" },
  { file: "photo-early-construction.jpg", id: "drawing-04-construction-icf", kind: "drawing", caption: "Construction Details — Insulated concrete form (ICF) foundation & heavy snow load roof overhangs" },

  // Exterior Renders
  { file: "render-lake-panoramic.jpg", id: "render-01-lake-panoramic", kind: "image", caption: "Panoramic View — Mill Lake Retreat oriented toward the water" },
  { file: "render-north-facade-main.jpg", id: "render-02-north-facade-main", kind: "image", caption: "North Façade — Continuous glazing connecting interior to water and forest" },
  { file: "render-exterior-perspective.jpg", id: "render-03-exterior-perspective", kind: "image", caption: "Exterior Perspective — Stepped building volume sitting naturally against granite" },

  // Interior Renders
  { file: "render-kitchen-island.jpg", id: "render-04-kitchen-island", kind: "image", caption: "Open-Concept Kitchen — Integrated kitchen, dining, and living social heart" },
  { file: "render-kitchen-dining.jpg", id: "render-05-kitchen-dining", kind: "image", caption: "Kitchen & Dining — Expansive lake views and natural light" },
  { file: "render-living-room-lake-view.jpg", id: "render-06-living-lake-view", kind: "image", caption: "Living Area — Deep daylight penetration with unbroken lake vistas" },
  { file: "render-living-room-fireplace.jpg", id: "render-07-living-interior", kind: "image", caption: "Living Room Interior — Warm timber detailing and contemporary comfort" },

  // Construction Photos
  { file: "photo-icf-foundation.jpg", id: "photo-01-icf-foundation", kind: "image", caption: "ICF Foundation — High-performance thermal envelope anchored into Canadian Shield granite" },
  { file: "photo-porch-structure.jpg", id: "photo-02-porch-overhang", kind: "image", caption: "Timber Porch Structure — Engineered wide overhangs protecting entrances from heavy snow loads" }
];

async function main() {
  console.log("Uploading individual cropped drawings and renders to Cloudinary...");
  const uploaded = {};

  for (const item of filesToUpload) {
    const filePath = path.join(cropDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} not found, skipping.`);
      continue;
    }
    console.log(`Uploading ${item.id} (${item.file})...`);
    const res = await cloudinary.uploader.upload(filePath, {
      folder: "utarch/mill-lake/assets",
      public_id: item.id,
      overwrite: true,
      invalidate: true,
    });
    uploaded[item.id] = res.secure_url;
    console.log(`  -> ${res.width}x${res.height} [${(res.bytes / 1024).toFixed(0)} KB]: ${res.secure_url}`);
  }

  // 1. Technical drawings (plans)
  const plans = [
    { title: "Sheet 01 — Site Plan (2025)", url: uploaded["drawing-01-site-plan"] },
    { title: "Sheet 02 — Floor Plans (Main & Second Level)", url: uploaded["drawing-02-floor-plans"] },
    { title: "Sheet 03 — Elevations & Building Sections", url: uploaded["drawing-03-elevations-sections"] },
    { title: "Sheet 04 — Construction & Envelope Detailing", url: uploaded["drawing-04-construction-icf"] }
  ];

  // 2. Pure gallery images (renders and photography ONLY - no text slides!)
  const galleryImages = [
    uploaded["render-02-north-facade-main"],
    uploaded["render-03-exterior-perspective"],
    uploaded["render-04-kitchen-island"],
    uploaded["render-05-kitchen-dining"],
    uploaded["render-06-living-lake-view"],
    uploaded["render-07-living-interior"],
    uploaded["photo-01-icf-foundation"],
    uploaded["photo-02-porch-overhang"]
  ].filter(Boolean);

  const heroImage = uploaded["render-01-lake-panoramic"];
  const coverImage = uploaded["render-01-lake-panoramic"];

  // 3. Highlight Stats
  const highlightStats = [
    { label: "LOCATION", value: "McDougall, ON" },
    { label: "YEAR", value: "2025" },
    { label: "TYPOLOGY", value: "Multi-Gen Retreat" },
    { label: "ENVELOPE", value: "ICF + All-Electric" }
  ];

  // 4. Structured methodology text extracted from Canva
  const methodologySteps = [
    {
      title: "Site Planning & Shoreline Axis",
      description: "The site plan follows the natural edge of the lake, stretching the house along a clear axis so that each room captures a direct view of the water. The main volume runs parallel to the shoreline, while the garage and four-season room step slightly off the line to sit comfortably against the granite Canadian Shield outcroppings."
    },
    {
      title: "Spatial Organization & Floor Plans",
      description: "The main floor is organized around an open-concept kitchen, dining, and living area that forms the social core of the retreat. The primary bedroom is located at one end for privacy, while the four-season room is placed at the opposite end to create a buffer between quiet and active spaces. The second floor supports multi-generational living with dedicated bedrooms, shared bathrooms, and a central family room."
    },
    {
      title: "Façade Elevations & Topographical Sections",
      description: "The building form steps with the natural granite slope, featuring an expansive three-storey lake-facing north façade characterized by continuous glazing that connects interior living spaces to the water and forest, alongside a sheltered two-storey south façade."
    },
    {
      title: "Passive Sustainability & High-Performance Envelope",
      description: "Sustainability is achieved through passive design, a high-performance building envelope, and efficient all-electric systems. Optimized orientation enhances daylight and solar control, while insulated concrete form foundations, high-performance insulation, and glazing reduce heat loss. Air-source heat pumps and heat recovery ventilation (HRV) further minimize energy use."
    },
    {
      title: "Snow Load Engineering & Construction Detailing",
      description: "The roof structure is engineered for heavy northern snow loads with deep overhangs that direct snow and water away from entrances and walkways, paired with durable timber and masonry detailing suited for long-term family use."
    }
  ];

  // 5. Project Concept / Description
  const description = `Mill Lake Retreat is a multi-generational residential retreat located on the southern shore of a Northern Ontario lake in McDougall, Ontario, Canada.

The scope of work included full architectural services for a new-build single detached dwelling, encompassing site planning, building design, envelope strategy, and integration of structural and energy-efficient systems.

The project responds to a rugged Canadian Shield landscape through a linear building form aligned with the shoreline, ensuring every principal space engages the lake. Design development balanced spatial clarity, durability, and environmental performance, resulting in a contemporary retreat suited for year-round occupation and long-term family use.

The Canadian Shield sets up key design challenges, with rock outcroppings to the south and a gentle slope down to the lake on the north side. The main volume runs parallel to the shoreline, while the garage and four-season room step slightly off the line to sit naturally against the granite formation. Simple, direct circulation keeps the focus on the relationship between the building, the land, and the lake.

Project Team & Credits:
• Supervised & Checked By: Lloyd Hunt Architect
• Architecture Team: Lloyd Hunt Architect & Uyen Ton (Architectural Technologist)
• Client: Wayne Freethy
• Interior Design: Aspen & Ivy Interior Design
• GC / Builder: RBA Projects`;

  const outcomes = `Mill Lake Retreat is a response to its natural setting, shaped by the desire to connect daily living with the lake, the forest, and the rugged Canadian Shield terrain.

Through careful orientation, clear spatial organization, and integrated sustainable strategies, the project creates a contemporary retreat that supports multi-generational living while remaining deeply rooted in its place.`;

  console.log("Updating projects table (id = 1)...");
  await pool.query(
    `UPDATE projects SET
      title = $1,
      client = $2,
      subtitle = $3,
      category = $4,
      role = $5,
      focus = $6,
      tools = $7,
      cover_image = $8,
      hero_image = $9,
      description = $10,
      outcomes = $11,
      highlight_stats = $12,
      methodology_steps = $13,
      gallery_images = $14,
      plans = $15,
      sort_order = $16,
      published = $17,
      starts_on = $18,
      ends_on = $19,
      phase = $20
    WHERE id = 1`,
    [
      "MILL LAKE RETREAT",
      "Wayne Freethy",
      "Multi-Generational Lakefront Residence",
      "Residential",
      "Architectural Technologist",
      "Residential Architecture, Site Planning & Sustainable Envelope",
      "AutoCAD, Revit, Lumion, High-Performance ICF Envelope",
      coverImage,
      heroImage,
      description,
      outcomes,
      JSON.stringify(highlightStats),
      JSON.stringify(methodologySteps),
      JSON.stringify(galleryImages),
      JSON.stringify(plans),
      1,
      true,
      "2024",
      "2025",
      "Complete"
    ]
  );

  console.log("Updating project_media records with clean assets...");
  await pool.query(`DELETE FROM project_media WHERE project_id = 1`);

  for (const item of filesToUpload) {
    if (uploaded[item.id]) {
      await pool.query(
        `INSERT INTO project_media (project_id, kind, url, public_id, original_name, caption)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          1,
          item.kind,
          uploaded[item.id],
          item.id,
          item.file,
          item.caption
        ]
      );
    }
  }

  // 6. Update Site Settings with Uyen Ton's profile extracted from Canva
  console.log("Updating site_settings with Uyen Ton's profile from Canva...");
  await pool.query(
    `UPDATE site_settings SET
      owner_name = $1,
      title = $2,
      subtitle = $3,
      hero_image = $4,
      about_heading = $5,
      about_body = $6,
      info_items = $7,
      location = $8,
      email = $9,
      archive_date_range = $10
    WHERE id = 1`,
    [
      "Uyen Ton",
      "Architectural Technologist",
      "Residential design, technical documentation, and sustainable building solutions in Ontario.",
      heroImage,
      "Clarity of Form, Functionality & Sustainability",
      `I am an Architectural Designer with over three years of experience at Lloyd Hunt Architect, contributing to residential and mid-scale projects in Ontario. My work focuses on developing design concepts, producing technical documentation, and coordinating spatial, structural, and energy-efficient solutions.

I am particularly interested in the relationship between architecture and context, and in how design can enhance quality of life through clarity of form, functionality, and sustainability. The projects I contribute to aim to balance architectural intent, operational efficiency, and long-term usability.

Education:
• Architecture Technologist Advanced Diploma — Sheridan College
• General Art & Science Certificate — Sheridan College`,
      JSON.stringify([
        "ONTARIO, CANADA",
        "LLOYD HUNT ARCHITECT",
        "RESIDENTIAL & SUSTAINABILITY",
        "SHERIDAN COLLEGE GRADUATE",
        "AUTOCAD & REVIT",
        "AVAILABLE FOR COLLABORATION"
      ]),
      "Ontario, Canada",
      "uyenton.arch@gmail.com",
      "2022 — Present"
    ]
  );

  console.log("Done! Mill Lake Retreat & Portfolio Site Settings successfully synced with clean assets and text!");
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
