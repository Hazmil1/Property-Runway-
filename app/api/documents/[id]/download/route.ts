import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient,leaseBucket } from "@/lib/supabase/admin";
import { apiError } from "@/lib/http";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params;const ctx=await requireContext();
 const d=await prisma.leaseDocument.findFirst({where:{id,lease:{organisationId:ctx.organisation.id}}});if(!d)throw new Error("Document not found");
 const admin=createSupabaseAdminClient();const {data,error}=await admin.storage.from(leaseBucket()).createSignedUrl(d.storageKey,120);
 if(error||!data?.signedUrl)throw error??new Error("Unable to create download link");
 return NextResponse.json({url:data.signedUrl,expiresIn:120});
}catch(e){return apiError(e)}}
