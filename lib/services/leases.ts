import { prisma } from "@/lib/db/prisma";
import { calculateRunway } from "@/lib/domain/runway";
import type { RequestContext } from "@/lib/auth/context";
import type { LeaseDecision } from "@/generated/prisma/client";
import { assertCanEditLeases } from "@/lib/auth/permissions";

export async function listLeases(ctx:RequestContext){
 const rows=await prisma.lease.findMany({where:{organisationId:ctx.organisation.id,status:{not:"ARCHIVED"}},include:{property:true,supplier:true,owner:true},orderBy:{actionByDate:"asc"}});
 return rows.map(c=>({...c,runway:calculateRunway({expiryDate:c.expiryDate,contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays})}));
}
export async function getLease(ctx:RequestContext,id:string){
 const c=await prisma.lease.findFirst({where:{id,organisationId:ctx.organisation.id},include:{supplier:true,owner:true,tenderPlan:{include:{milestones:{orderBy:{order:"asc"}}}},runwayOverrides:{orderBy:{createdAt:"desc"},take:10,include:{approvalRequest:true}},tasks:{orderBy:[{status:"asc"},{dueAt:"asc"}],take:20},approvalRequests:{orderBy:{createdAt:"desc"},take:10},legalAmendments:{orderBy:{createdAt:"desc"},take:10,include:{requester:true,decider:true}},notificationRules:{orderBy:[{eventType:"asc"},{offsetDays:"desc"}]},documents:{orderBy:{createdAt:"desc"},take:20,include:{clauses:true,suggestions:true}}}});
 if(!c)return null;
 return{...c,runway:calculateRunway({expiryDate:c.expiryDate,contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays})};
}
export async function createLease(ctx:RequestContext,input:{propertyId?:string;unit?:string;direction?:string;name:string;supplierName:string;ownerId?:string|null;value?:number;currency:string;startDate?:Date|null;expiryDate:Date;contractualNoticeDays:number;planningRunwayDays:number;category?:string|null;reference?:string|null;autoRenews:boolean}){
 assertCanEditLeases(ctx);
 if(!input.propertyId)throw new Error("Link the lease to a property first");
 if(!await prisma.property.findFirst({where:{id:input.propertyId,organisationId:ctx.organisation.id,archived:false}}))throw new Error("Property not found");
 if(input.ownerId&&!await prisma.user.findFirst({where:{id:input.ownerId,organisationId:ctx.organisation.id,active:true}}))throw new Error("Manager not found");
 const runway=calculateRunway(input);
 return prisma.$transaction(async tx=>{
  const supplier=await tx.supplier.upsert({where:{organisationId_name:{organisationId:ctx.organisation.id,name:input.supplierName}},update:{},create:{organisationId:ctx.organisation.id,name:input.supplierName}});
  const c=await tx.lease.create({data:{propertyId:input.propertyId,unit:input.unit,direction:input.direction||"TENANT",organisationId:ctx.organisation.id,supplierId:supplier.id,ownerId:input.ownerId||ctx.user.id,name:input.name,reference:input.reference,value:input.value,currency:input.currency,startDate:input.startDate,expiryDate:input.expiryDate,contractualNoticeDays:input.contractualNoticeDays,planningRunwayDays:input.planningRunwayDays,legalNoticeDate:runway.legalNoticeDate,actionByDate:runway.actionByDate,category:input.category,autoRenews:input.autoRenews}});
  await tx.notificationRule.createMany({data:[{leaseId:c.id,eventType:"ACTION_BY",offsetDays:30,channel:"IN_APP"},{leaseId:c.id,eventType:"ACTION_BY",offsetDays:7,channel:"IN_APP"},{leaseId:c.id,eventType:"LEGAL_NOTICE",offsetDays:30,channel:"IN_APP"}]});
  await tx.auditEvent.create({data:{userId:ctx.user.id,organisationId:ctx.organisation.id,entityType:"Lease",entityId:c.id,action:"CREATED",afterJson:{name:c.name,expiryDate:c.expiryDate.toISOString(),contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays}}});
  return c;
 });
}
export async function recordDecision(ctx:RequestContext,leaseId:string,decision:LeaseDecision,note?:string){
 assertCanEditLeases(ctx);const existing=await prisma.lease.findFirst({where:{id:leaseId,organisationId:ctx.organisation.id}});if(!existing)throw new Error("Lease not found");
 return prisma.$transaction(async tx=>{
  const updated=await tx.lease.update({where:{id:leaseId},data:{decision}});
  await tx.auditEvent.create({data:{userId:ctx.user.id,organisationId:ctx.organisation.id,entityType:"Lease",entityId:leaseId,action:"DECISION_CHANGED",beforeJson:{decision:existing.decision},afterJson:{decision},reason:note}});
  await tx.task.create({data:{leaseId,assigneeId:existing.ownerId,title:decision==="RELOCATE"?"Start procurement plan":`Progress ${decision.toLowerCase()} decision`,description:note,sourceType:"LEASE_DECISION",sourceId:leaseId}});
  return updated;
 });
}
