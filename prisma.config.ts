import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Prisma generate does not need a live database. Runtime/database commands
    // still use DATABASE_URL when Render injects it.
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@127.0.0.1:5432/lease_runway"
  }
});
