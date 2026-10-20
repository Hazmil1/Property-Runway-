import "dotenv/config";
import {productionConfigProblems} from "../lib/deployment/config";
import {PrismaPg} from "@prisma/adapter-pg";import {PrismaClient} from "../generated/prisma/client";import {createClient} from "@supabase/supabase-js";
const problems=productionConfigProblems(process.env);if(problems.length)throw Error(problems.join("; "));
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await admin.storage.listBuckets();if(error)throw Error("Supabase private storage verification failed");
const target=data.find(x=>x.id===(process.env.SUPABASE_PROPERTY_BUCKET||"property-documents"));
if(!target||target.public)throw Error("Private property document bucket is missing or public");
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000,max:3})});
try{
 const org=await db.organisation.findUnique({where:{slug:"property-runway"}});if(!org)throw Error("Property workspace bootstrap is required");
 const unprotected=await db.$queryRaw<{tablename:string}[]>`select tablename from pg_tables where schemaname='public' and tablename <> '_prisma_migrations' and not rowsecurity`;
 if(unprotected.length)throw Error("Application tables without row security found");
 console.log("Production database, workspace and private storage checks passed.");
 console.log("Email: "+(process.env.RESEND_API_KEY?"configured; verify sender before use":"disabled; in-app reminders only"));
 console.log("Extraction: "+(process.env.AI_EXTRACTION_MODE==="webhook"?"configured; provider acceptance test required":"disabled; enter confirmed terms manually"));
}finally{await db.$disconnect()}
