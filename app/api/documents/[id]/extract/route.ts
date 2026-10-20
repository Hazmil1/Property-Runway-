import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { extractDocument } from "@/lib/services/extraction";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { apiError } from "@/lib/http";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);
 const d=await prisma.leaseDocument.findFirst({where:{id,lease:{organisationId:ctx.organisation.id}}});if(!d)throw new Error("Document not found");
 return NextResponse.json(await extractDocument(id));
}catch(e){return apiError(e)}}
