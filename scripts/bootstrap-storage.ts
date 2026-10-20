import "dotenv/config";import {createClient} from "@supabase/supabase-js";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error("Supabase server credentials are required");
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=process.env.SUPABASE_PROPERTY_BUCKET||"property-documents";
const {data,error}=await client.storage.listBuckets();if(error)throw Error("Unable to verify private document storage");
const current=data.find(x=>x.id===bucket);
if(current?.public)throw Error("Document bucket is public. Correct its visibility before deploying.");
if(!current){const result=await client.storage.createBucket(bucket,{public:false,fileSizeLimit:20*1024*1024});if(result.error)throw Error("Private document bucket creation failed");}
console.log("Private property document bucket ready.");
