import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
import path from "path";

const inDbPackage = process.cwd().replace(/[\\/]+$/, "").endsWith("db");
loadEnv({ path: path.resolve(inDbPackage ? "../.." : ".", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: inDbPackage ? "./src/schema/index.ts" : "./lib/db/src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
