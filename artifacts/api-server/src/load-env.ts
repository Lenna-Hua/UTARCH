import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load repo-root `.env` then local `.env` (local wins). Safe no-op if missing.
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../.env") });
loadEnv({ path: path.resolve(here, "../.env"), override: true });
