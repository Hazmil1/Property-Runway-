import "dotenv/config";
import pg from "pg";import {spawnSync} from "node:child_process";import {readdirSync} from "node:fs";
const url=process.env.DATABASE_URL;if(!url)throw Error("DATABASE_URL is required");
const db=new pg.Client({connectionString:url,connectionTimeoutMillis:15000});
function prisma(...args:string[]){const r=spawnSync(process.execPath,["node_modules/prisma/build/index.js",...args],{stdio:"inherit",env:process.env});if(r.error||r.status!==0)throw Error("Database preparation stopped: Prisma "+args[0]+" failed");}
const initial="20261020163000_initial_property_runway";
await db.connect();
try{
 const lock=await db.query("select pg_try_advisory_lock(728431905) as locked");
 if(!lock.rows[0].locked)throw Error("Another database preparation is running; retry after it finishes");
 const tables=await db.query("select tablename from pg_tables where schemaname='public' and tablename <> '_prisma_migrations'");
 const history=await db.query("select to_regclass('public._prisma_migrations') as relation");
 if(tables.rows.length&&!history.rows[0].relation){
  if(process.env.BASELINE_EXISTING_SCHEMA!=="true")throw Error("Existing schema has no Prisma history. Review it before setting BASELINE_EXISTING_SCHEMA=true for first deployment.");
  const migrations=readdirSync("prisma/migrations",{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
  if(migrations.length!==1||migrations[0]!==initial)throw Error("Existing schema needs a manual baseline review against its original migration");
  // Resolve only after exact Prisma schema and row security checks pass. Never reset or push.
  prisma("migrate","diff","--from-config-datasource","--to-schema","prisma/schema.prisma","--exit-code");
  const unprotected=await db.query("select tablename from pg_tables where schemaname='public' and not rowsecurity");
  if(unprotected.rows.length)throw Error("Existing application tables must have row security enabled before baselining");
  prisma("migrate","resolve","--applied",initial);
 }
 prisma("migrate","deploy");
 await db.query('ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY');
 console.log("Database migrations ready.");
}finally{await db.end();}
