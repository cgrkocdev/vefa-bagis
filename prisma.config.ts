import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Runtime traffic uses the pooled URL; migrations should prefer a direct
    // connection when the database provider exposes one.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
