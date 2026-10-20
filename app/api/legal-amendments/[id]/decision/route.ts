import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanAmendLegalTerms } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { calculateRunway } from "@/lib/domain/runway";
import { apiError } from "@/lib/http";

const schema=z.object({approve:z.boolean(),reason:z.string().trim().max(2000).optional()});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanAmendLegalTerms(ctx);const input=schema.parse(await req.json());
  const amendment=await prisma.legalAmendment.findFirst({where:{id,status:"PENDING",lease:{organisationId:ctx.organisation.id}},include:{lease:true}});
  if(!amendment)throw new Error("Pending legal amendment not found");
  if(amendment.requesterId===ctx.user.id)throw new Error("A different authorised legal reviewer is required");
  await prisma.$transaction(async tx=>{
   const claimed=await tx.legalAmendment.updateMany({where:{id,status:"PENDING"},data:{status:input.approve?"APPROVED":"REJECTED"}});
   if(claimed.count!==1)throw new Error("Amendment already decided");
   if(input.approve){
    const expiryDate=amendment.proposedExpiryDate??amendment.lease.expiryDate;
    const contractualNoticeDays=amendment.proposedNoticeDays??amendment.lease.contractualNoticeDays;
    const runway=calculateRunway({expiryDate,contractualNoticeDays,planningRunwayDays:amendment.lease.planningRunwayDays});
    await tx.lease.update({where:{id:amendment.leaseId},data:{expiryDate,contractualNoticeDays,legalNoticeDate:runway.legalNoticeDate,actionByDate:runway.actionByDate,contractualTermsConfirmedAt:new Date(),contractualTermsConfirmedById:ctx.user.id}});
   }
   await tx.legalAmendment.update({where:{id},data:{status:input.approve?"APPROVED":"REJECTED",deciderId:ctx.user.id,decidedAt:new Date(),decisionReason:input.reason}});
   await tx.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"LegalAmendment",entityId:id,action:input.approve?"LEGAL_AMENDMENT_APPROVED":"LEGAL_AMENDMENT_REJECTED",reason:input.reason,afterJson:{leaseId:amendment.leaseId}}});
  });
  return NextResponse.json({ok:true});
 }catch(e){return apiError(e)}
}
