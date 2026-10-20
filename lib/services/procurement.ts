import { prisma } from "@/lib/db/prisma";
import type { RequestContext } from "@/lib/auth/context";
import { addDays } from "@/lib/domain/runway";
import { assertCanEditLeases } from "@/lib/auth/permissions";

export const defaultTenderTemplate=[
 {name:"Specification & stakeholder discovery",durationDays:30,ownerLabel:"Business"},
 {name:"Procurement preparation & approvals",durationDays:30,ownerLabel:"Procurement"},
 {name:"Tender & evaluation",durationDays:90,ownerLabel:"Procurement"},
 {name:"Mobilisation & transition",durationDays:45,ownerLabel:"Business"},
 {name:"Contingency",durationDays:15,ownerLabel:"Lease owner"}
];

export async function ensureTenderPlan(ctx:RequestContext,leaseId:string){
 assertCanEditLeases(ctx);
 const lease=await prisma.lease.findFirst({where:{id:leaseId,organisationId:ctx.organisation.id}});
 if(!lease)throw new Error("Lease not found");
 const existing=await prisma.tenderPlan.findUnique({where:{leaseId},include:{milestones:{orderBy:{order:"asc"}}}});
 if(existing)return existing;
 let cursor=lease.actionByDate;
 const milestones=defaultTenderTemplate.map((m,order)=>{const startDate=cursor;const endDate=addDays(startDate,m.durationDays);cursor=endDate;return{...m,order,startDate,endDate}});
 return prisma.tenderPlan.create({data:{leaseId,targetAwardDate:lease.legalNoticeDate,milestones:{create:milestones}},include:{milestones:{orderBy:{order:"asc"}}}});
}
