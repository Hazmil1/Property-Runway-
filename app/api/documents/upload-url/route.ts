import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient,leaseBucket } from "@/lib/supabase/admin";
import { apiError } from "@/lib/http";
const schema=z.object({leaseId:z.string().min(1),filename:z.string().min(1).max(240),mimeType:z.string().min(1),sizeBytes:z.number().int().positive().max(50*1024*1024)});
export async function POST(req:Request){try{
 const ctx=await requireContext();const input=schema.parse(await req.json());
 const lease=await prisma.lease.findFirst({where:{id:input.leaseId,organisationId:ctx.organisation.id}});
 if(!lease)throw new Error("Lease not found");
 const doc=await prisma.leaseDocument.create({data:{leaseId:lease.id,filename:input.filename,mimeType:input.mimeType,sizeBytes:input.sizeBytes,storageKey:"pending"}});
 const safe=input.filename.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`leases/${ctx.organisation.id}/${lease.id}/${doc.id}/${safe}`;
 await prisma.leaseDocument.update({where:{id:doc.id},data:{storageKey:path}});
 const admin=createSupabaseAdminClient();const {data,error}=await admin.storage.from(leaseBucket()).createSignedUploadUrl(path);
 if(error||!data?.token)throw error??new Error("Unable to create upload URL");
 return NextResponse.json({documentId:doc.id,path,token:data.token});
}catch(e){return apiError(e)}}
