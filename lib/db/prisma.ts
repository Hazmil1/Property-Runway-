import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Next.js imports route modules during build/page-data collection. Prisma
  // does not establish a DB connection until a query runs, so a harmless
  // placeholder is sufficient for build-time module evaluation.
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@127.0.0.1:5432/lease_runway";
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
