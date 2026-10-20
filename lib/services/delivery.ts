import {prisma} from "@/lib/db/prisma";import {createHash} from "node:crypto";
const escape=(s:unknown)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export async function deliverQueuedEmails(limit=100){
 if(!process.env.RESEND_API_KEY||!process.env.NOTIFICATION_FROM_EMAIL)return {scanned:0,sent:0,failed:0,skipped:true,reason:"Email delivery is not configured"};
 const events=await prisma.notificationEvent.findMany({where:{channel:"EMAIL",sentAt:null,scheduledFor:{lte:new Date()}},include:{lease:true,user:true,propertyEvent:true},orderBy:{scheduledFor:"asc"},take:limit});let sent=0,failed=0;
 for(const event of events){try{
 if(!event.user?.active||!event.user.email)throw Error("Recipient unavailable");
 if(event.lease&&event.lease.status!=="ACTIVE")continue;
 if(event.propertyEvent&&["COMPLETE","CANCELLED"].includes(event.propertyEvent.status))continue;
 if(event.acknowledgedAt)continue;
 const payload=event.payload as Record<string,unknown>;const name=event.lease?.name||payload.propertyName||"Property Runway";
 const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:"Bearer "+process.env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":createHash("sha256").update(event.dedupeKey).digest("hex")},body:JSON.stringify({from:process.env.NOTIFICATION_FROM_EMAIL,to:[event.user.email],subject:"Property action: "+name,html:"<h2>"+escape(name)+"</h2><p>"+escape(event.eventType.replaceAll("_"," "))+"</p><p>"+escape(payload.eventTitle)+"</p><p>Deadline: "+escape(payload.anchorDate)+"</p><p>Review the property record and confirm the next action in Property Runway.</p>"})});
 if(!result.ok)throw Error("Email provider returned "+result.status);
 await prisma.notificationEvent.update({where:{id:event.id},data:{sentAt:new Date(),failedAt:null,failureReason:null}});sent++;
 }catch(error){await prisma.notificationEvent.update({where:{id:event.id},data:{failedAt:new Date(),failureReason:error instanceof Error?error.message:"Delivery failed"}});failed++;}}
 return {scanned:events.length,sent,failed,skipped:false};
}
