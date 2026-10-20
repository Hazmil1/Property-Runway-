import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { addDays } from "@/lib/domain/runway";
import { apiError } from "@/lib/http";

const schema=z.object({
 name:z.string().trim().min(2).max(160),
 durationDays:z.coerce.number().int().min(0).max(730),
 ownerLabel:z.string().trim().max(120).optional(),
 status:z.enum(["NOT_STARTED","IN_PROGRESS","BLOCKED","DONE"])
});

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const input=schema.parse(await req.json());
  const milestone=await prisma.tenderMilestone.findFirst({where:{id,tenderPlan:{lease:{organisationId:ctx.organisation.id}}},include:{tenderPlan:{include:{lease:true,milestones:{orderBy:{order:"asc"}}}}}});
  if(!milestone)throw new Error("Tender milestone not found");
  await prisma.$transaction(async tx=>{
   await tx.tenderMilestone.update({where:{id},data:{name:input.name,durationDays:input.durationDays,ownerLabel:input.ownerLabel||null,status:input.status}});
   const all=milestone.tenderPlan.milestones.map(m=>m.id===id?{...m,...input}:m);let cursor=milestone.tenderPlan.lease.actionByDate;
   for(const m of all){const startDate=cursor;const endDate=addDays(startDate,m.durationDays);cursor=endDate;await tx.tenderMilestone.update({where:{id:m.id},data:{startDate,endDate}})}
   await tx.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"TenderMilestone",entityId:id,action:"TENDER_MILESTONE_UPDATED",beforeJson:{name:milestone.name,durationDays:milestone.durationDays,ownerLabel:milestone.ownerLabel,status:milestone.status},afterJson:input}});
  });
  return NextResponse.json({ok:true});
 }catch(e){return apiError(e)}
}
