type Environment=Record<string,string|undefined>;
export function productionConfigProblems(env:Environment):string[]{
 const problems:string[]=[];
 for(const key of ["DATABASE_URL","NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SERVICE_ROLE_KEY","BOOTSTRAP_OWNER_EMAIL"]){if(!env[key]?.trim())problems.push(key+" is required");}
 if(env.ALLOW_DEV_AUTH==="true")problems.push("Development authentication must be disabled");
 if(env.DEMO_ONLY==="true")problems.push("DEMO_ONLY must be false for the full application");
 for(const key of ["NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_URL"]){if(env[key]){try{const u=new URL(env[key]!);if(u.protocol!=="https:"||u.username||u.password)problems.push(key+" must be an HTTPS URL without credentials");}catch{problems.push(key+" must be a valid URL");}}}
 if(env.BOOTSTRAP_OWNER_EMAIL&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BOOTSTRAP_OWNER_EMAIL))problems.push("BOOTSTRAP_OWNER_EMAIL must be a valid email");
 if(env.DATABASE_URL){try{const u=new URL(env.DATABASE_URL);if(!["postgres:","postgresql:"].includes(u.protocol))problems.push("DATABASE_URL must be a Postgres connection URL");}catch{problems.push("DATABASE_URL must be a valid connection URL");}}
 if(env.CRON_SECRET&&env.CRON_SECRET.length<32)problems.push("CRON_SECRET must contain at least 32 characters");
 if(Boolean(env.RESEND_API_KEY)!==Boolean(env.NOTIFICATION_FROM_EMAIL))problems.push("Configure both RESEND_API_KEY and NOTIFICATION_FROM_EMAIL");
 if(env.AI_EXTRACTION_MODE==="mock")problems.push("Mock extraction cannot run in production");
 if(env.AI_EXTRACTION_MODE==="webhook"){for(const k of ["AI_EXTRACTION_WEBHOOK_URL","AI_EXTRACTION_WEBHOOK_SECRET"]){if(!env[k])problems.push(k+" is required for webhook extraction");}if(env.AI_EXTRACTION_WEBHOOK_URL&&!env.AI_EXTRACTION_WEBHOOK_URL.startsWith("https://"))problems.push("Extraction webhook must use HTTPS");}
 return problems;
}
