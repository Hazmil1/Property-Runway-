import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";

const schema=z.object({
 expiryDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
 contractualNoticeDays:z.coerce.number().int().min(0).max(3650).optional(),
 reason:z.string().trim().min(10).max(2000)
}).refine(v=>v.expiryDate!==undefined||v.contractualNoticeDays!==undefined,"At least one legal term must change");

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const input=schema.parse(await req.json());
  const lease=await prisma.lease.findFirst({where:{id,organisationId:ctx.organisation.id}});
  if(!lease)throw new Error("Lease not found");
  if(!lease.contractualTermsConfirmedAt)throw new Error("Contractual terms are not locked yet; confirm source terms first");
  const proposedExpiryDate=input.expiryDate?new Date(input.expiryDate+"T00:00:00Z"):undefined;
  const amendment=await prisma.legalAmendment.create({data:{leaseId:id,requesterId:ctx.user.id,proposedExpiryDate,proposedNoticeDays:input.contractualNoticeDays,reason:input.reason}});
  await prisma.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"LegalAmendment",entityId:amendment.id,action:"LEGAL_AMENDMENT_REQUESTED",beforeJson:{expiryDate:lease.expiryDate.toISOString(),contractualNoticeDays:lease.contractualNoticeDays},afterJson:{expiryDate:proposedExpiryDate?.toISOString(),contractualNoticeDays:input.contractualNoticeDays},reason:input.reason}});
  return NextResponse.json(amendment,{status:201});
 }catch(e){return apiError(e)}
}
