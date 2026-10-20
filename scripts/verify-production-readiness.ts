import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

if(process.env.DEMO_ONLY==="true"){console.log("Concept demo: no live database, login, storage or email access.");process.exit(0);}
const appUrl=process.env.NEXT_PUBLIC_APP_URL||"";
if(!process.env.RENDER&&process.env.NODE_ENV!=="production"){
  console.log("Production readiness check skipped outside Render production.");
  process.exit(0);
}

const databaseUrl=process.env.DATABASE_URL;
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(process.env.ALLOW_DEV_AUTH==="true")throw new Error("Development authentication must be disabled in production");
const bootstrapOwnerEmail=process.env.BOOTSTRAP_OWNER_EMAIL;
const bucket=process.env.SUPABASE_PROPERTY_BUCKET||"property-documents";

if(!supabaseUrl)throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing in Render");
if(!serviceRole)throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in Render");

const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await admin.storage.listBuckets();
if(error)throw new Error(`Supabase admin check failed: ${error.message}`);
const target=data?.find(b=>b.id===bucket);
if(!target)throw new Error(`Private storage bucket "${bucket}" was not found`);
if(target.public)throw new Error(`Storage bucket "${bucket}" must remain private`);
console.log("Supabase admin and private storage checks OK.");

if(!bootstrapOwnerEmail)throw new Error("BOOTSTRAP_OWNER_EMAIL is missing in Render");
console.log("Bootstrap owner email is configured.");

if(!databaseUrl)throw new Error("DATABASE_URL is missing in Render");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:databaseUrl})});
try{
  const organisations=await prisma.organisation.count();
  console.log(`Database connectivity OK (${organisations} organisation record(s)).`);
}finally{
  await prisma.$disconnect();
}
