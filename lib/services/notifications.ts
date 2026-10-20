import {prisma} from "@/lib/db/prisma";import {addDays} from "@/lib/domain/runway";
export async function materialiseNotifications(now=new Date()){
 let queued=0;const leases=await prisma.lease.findMany({where:{status:"ACTIVE"},include:{notificationRules:{where:{enabled:true}},owner:true}});
 for(const lease of leases){if(!lease.owner?.active)continue;const anchors:Record<string,Date>={ACTION_BY:lease.actionByDate,LEGAL_NOTICE:lease.legalNoticeDate,EXPIRY:lease.expiryDate};
 for(const rule of lease.notificationRules){const anchor=anchors[rule.eventType];if(!anchor)continue;const scheduledFor=addDays(anchor,-rule.offsetDays);if(scheduledFor>now)continue;
 const dedupeKey=[lease.id,rule.id,lease.ownerId,scheduledFor.toISOString().slice(0,10)].join(":");
 const result=await prisma.notificationEvent.createMany({data:[{leaseId:lease.id,userId:lease.ownerId,channel:rule.channel,eventType:rule.eventType,dedupeKey,scheduledFor,sentAt:rule.channel==="IN_APP"?now:null,payload:{propertyId:lease.propertyId,leaseName:lease.name,anchorDate:anchor.toISOString()}}],skipDuplicates:true});queued+=result.count;
 }}
 const propertyEvents=await prisma.propertyEvent.findMany({where:{status:{notIn:["COMPLETE","CANCELLED"]},property:{archived:false}},include:{property:{include:{manager:true}},lease:{include:{owner:true}}}});
 for(const event of propertyEvents){const manager=event.lease?.owner||event.property.manager;if(!manager?.active)continue;
 const offsets=[90,30,7,0];const scheduled=offsets.map(d=>addDays(event.noticeDeadline,-d)).filter(d=>d<=now).sort((a,b)=>b.getTime()-a.getTime())[0];if(!scheduled)continue;
 const channel=process.env.RESEND_API_KEY?"EMAIL" as const:"IN_APP" as const;
 const dedupeKey=["property-event",event.id,manager.id,scheduled.toISOString().slice(0,10),channel].join(":");
 const result=await prisma.notificationEvent.createMany({data:[{propertyEventId:event.id,leaseId:event.leaseId,userId:manager.id,channel,eventType:event.type,dedupeKey,scheduledFor:scheduled,sentAt:channel==="IN_APP"?now:null,payload:{propertyName:event.property.name,eventTitle:event.title,anchorDate:event.noticeDeadline.toISOString()}}],skipDuplicates:true});queued+=result.count;
 if(now.getTime()-event.noticeDeadline.getTime()>7*86400000){
 const admins=await prisma.user.findMany({where:{organisationId:event.property.organisationId,active:true,role:{in:["OWNER","ADMIN"]},id:{not:manager.id}}});
 for(const admin of admins){const key=["escalation",event.id,admin.id,event.noticeDeadline.toISOString().slice(0,10)].join(":");const result=await prisma.notificationEvent.createMany({data:[{propertyEventId:event.id,leaseId:event.leaseId,userId:admin.id,channel,eventType:"ESCALATION",dedupeKey:key,scheduledFor:addDays(event.noticeDeadline,7),sentAt:channel==="IN_APP"?now:null,payload:{propertyName:event.property.name,eventTitle:event.title,managerName:manager.name,anchorDate:event.noticeDeadline.toISOString()}}],skipDuplicates:true});queued+=result.count;}
 }
 }
 return {scanned:leases.length+propertyEvents.length,queued};
}
