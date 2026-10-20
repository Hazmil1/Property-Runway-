import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { apiError } from "@/lib/http";
const schema=z.object({documentId:z.string().min(1)});
export async function POST(req:Request){try{
 const ctx=await requireContext();assertCanEditLeases(ctx);const {documentId}=schema.parse(await req.json());
 const d=await prisma.leaseDocument.findFirst({where:{id:documentId,lease:{organisationId:ctx.organisation.id}}});if(!d)throw new Error("Document not found");
 const updated=await prisma.leaseDocument.update({where:{id:d.id},data:{status:"READY"}});
 return NextResponse.json(updated);
}catch(e){return apiError(e)}}
