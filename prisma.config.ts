import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://build:build@localhost:5432/build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Runtime traffic uses the pooled URL; migrations should prefer a direct
    // connection when the database provider exposes one. Client generation
    // does not connect, so Vercel's dependency install can use a placeholder
    // before a database integration is attached.
    url: migrationUrl,
  },
});
