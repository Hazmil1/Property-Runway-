import {prisma} from "@/lib/db/prisma";
import type {RequestContext} from "@/lib/auth/context";
import {assertCanEditLeases} from "@/lib/auth/permissions";
import {propertySchema,propertyEventSchema} from "@/lib/validation/properties";
export async function listProperties(ctx:RequestContext){return prisma.property.findMany({where:{organisationId:ctx.organisation.id,archived:false},include:{manager:true,_count:{select:{leases:true,events:true,documents:true}}},orderBy:{name:"asc"}})}
export async function getProperty(ctx:RequestContext,id:string){return prisma.property.findFirst({where:{id,organisationId:ctx.organisation.id},include:{manager:true,leases:{include:{owner:true},orderBy:{expiryDate:"asc"}},events:{orderBy:{noticeDeadline:"asc"}},documents:{orderBy:{createdAt:"desc"}}}})}
export async function saveProperty(ctx:RequestContext,raw:unknown,id?:string){
 assertCanEditLeases(ctx);const data=propertySchema.parse(raw);
 if(data.managerId&&!await prisma.user.findFirst({where:{id:data.managerId,organisationId:ctx.organisation.id,active:true}}))throw new Error("Manager not found");
 return prisma.$transaction(async tx=>{
 const existing=id?await tx.property.findFirst({where:{id,organisationId:ctx.organisation.id}}):null;
 if(id&&!existing)throw new Error("Property not found");
 const property=id?await tx.property.update({where:{id},data:{...data,managerId:data.managerId||null}}):await tx.property.create({data:{...data,managerId:data.managerId||null,organisationId:ctx.organisation.id}});
 await tx.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"Property",entityId:property.id,action:id?"PROPERTY_UPDATED":"PROPERTY_CREATED",beforeJson:existing?{name:existing.name,tenure:existing.tenure,managerId:existing.managerId,archived:existing.archived}:undefined,afterJson:{name:property.name,tenure:property.tenure,managerId:property.managerId,archived:property.archived}}});
 return property;});
}
export async function savePropertyEvent(ctx:RequestContext,propertyId:string,raw:unknown,eventId?:string){
 assertCanEditLeases(ctx);const data=propertyEventSchema.parse(raw);
 return prisma.$transaction(async tx=>{
 const property=await tx.property.findFirst({where:{id:propertyId,organisationId:ctx.organisation.id}});if(!property)throw new Error("Property not found");
 if(data.leaseId&&!await tx.lease.findFirst({where:{id:data.leaseId,propertyId,organisationId:ctx.organisation.id}}))throw new Error("Linked lease not found");
 const existing=eventId?await tx.propertyEvent.findFirst({where:{id:eventId,propertyId}}):null;if(eventId&&!existing)throw new Error("Event not found");
 const legalChange=!!existing&&(existing.eventDate.getTime()!==data.eventDate.getTime()||existing.noticeDeadline.getTime()!==data.noticeDeadline.getTime());
 if(legalChange&&!["OWNER","ADMIN","LEGAL"].includes(ctx.user.role))throw new Error("Legal date amendment permission is required");
 if(legalChange&&(!data.notes||data.notes.trim().length<5))throw new Error("Record the reason and evidence for the date amendment");
 const event=eventId?await tx.propertyEvent.update({where:{id:eventId},data:{...data,leaseId:data.leaseId||null}}):await tx.propertyEvent.create({data:{...data,leaseId:data.leaseId||null,propertyId}});
 await tx.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"PropertyEvent",entityId:event.id,action:eventId?"EVENT_UPDATED":"EVENT_CREATED",beforeJson:existing?{eventDate:existing.eventDate.toISOString(),noticeDeadline:existing.noticeDeadline.toISOString(),status:existing.status}:undefined,afterJson:{eventDate:event.eventDate.toISOString(),noticeDeadline:event.noticeDeadline.toISOString(),status:event.status},reason:data.notes}});
 return event;});
}
