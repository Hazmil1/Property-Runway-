import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { calculateRunway } from "@/lib/domain/runway";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { apiError } from "@/lib/http";

const itemSchema=z.object({
 id:z.string().min(1),
 action:z.enum(["CONFIRM","CORRECT","REJECT"]),
 correctedValue:z.string().optional()
}).superRefine((v,ctx)=>{if(v.action==="CORRECT"&&!v.correctedValue?.trim())ctx.addIssue({code:"custom",message:"A corrected value is required"})});

const schema=z.object({items:z.array(itemSchema).min(1)});

const isoDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nonNegativeInt=z.coerce.number().int().min(0).max(3650);

function parseAccepted(fieldKey:string,value:string){
 if(fieldKey==="expiryDate"||fieldKey==="startDate"){
  const v=isoDate.parse(value);const d=new Date(v+"T00:00:00Z");if(Number.isNaN(d.getTime()))throw new Error(`${fieldKey} is invalid`);return d;
 }
 if(fieldKey==="contractualNoticeDays"||fieldKey==="renewalPeriodMonths")return nonNegativeInt.parse(value);
 if(fieldKey==="autoRenews"){
  const v=value.trim().toLowerCase();if(!["true","false"].includes(v))throw new Error("autoRenews must be true or false");return v==="true";
 }
 if(fieldKey==="extensionOptions")return value.trim();
 return value;
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const {items}=schema.parse(await req.json());
  const document=await prisma.leaseDocument.findFirst({where:{id,lease:{organisationId:ctx.organisation.id}},include:{lease:true,suggestions:{where:{status:"PENDING"}}}});
  if(!document)throw new Error("Document not found");
  const byId=new Map(document.suggestions.map(s=>[s.id,s]));
  if(items.some(i=>!byId.has(i.id)))throw new Error("One or more review items do not belong to this document");

  const accepted=new Map<string,unknown>();
  for(const item of items){
   const s=byId.get(item.id)!;if(item.action==="REJECT")continue;
   accepted.set(s.fieldKey,parseAccepted(s.fieldKey,item.action==="CORRECT"?item.correctedValue!:s.proposedValue));
  }

  const locked=!!document.lease.contractualTermsConfirmedAt;
  const legalChanged=
   (accepted.has("expiryDate")&&(accepted.get("expiryDate") as Date).getTime()!==document.lease.expiryDate.getTime())||
   (accepted.has("contractualNoticeDays")&&accepted.get("contractualNoticeDays")!==document.lease.contractualNoticeDays);

  const patch:any={};
  if(accepted.has("startDate"))patch.startDate=accepted.get("startDate");
  if(accepted.has("autoRenews"))patch.autoRenews=accepted.get("autoRenews");
  if(accepted.has("renewalPeriodMonths"))patch.renewalPeriodMonths=accepted.get("renewalPeriodMonths");
  if(accepted.has("extensionOptions"))patch.extensionOptions=accepted.get("extensionOptions");

  if(!locked){
   if(accepted.has("expiryDate"))patch.expiryDate=accepted.get("expiryDate");
   if(accepted.has("contractualNoticeDays"))patch.contractualNoticeDays=accepted.get("contractualNoticeDays");
   const expiry=(patch.expiryDate as Date|undefined)??document.lease.expiryDate;
   const notice=(patch.contractualNoticeDays as number|undefined)??document.lease.contractualNoticeDays;
   const runway=calculateRunway({expiryDate:expiry,contractualNoticeDays:notice,planningRunwayDays:document.lease.planningRunwayDays});
   patch.legalNoticeDate=runway.legalNoticeDate;patch.actionByDate=runway.actionByDate;
   patch.contractualTermsConfirmedAt=new Date();patch.contractualTermsConfirmedById=ctx.user.id;
  }

  let amendmentId:string|undefined;
  await prisma.$transaction(async tx=>{
   for(const item of items){
    await tx.extractionSuggestion.update({where:{id:item.id},data:{status:item.action==="CONFIRM"?"CONFIRMED":item.action==="CORRECT"?"CORRECTED":"REJECTED",correctedValue:item.action==="CORRECT"?item.correctedValue:null,reviewedById:ctx.user.id,reviewedAt:new Date()}});
   }
   if(Object.keys(patch).length)await tx.lease.update({where:{id:document.leaseId},data:patch});
   if(locked&&legalChanged){
    const pending=await tx.legalAmendment.findFirst({where:{leaseId:document.leaseId,status:"PENDING"}});
    if(!pending){
     const a=await tx.legalAmendment.create({data:{leaseId:document.leaseId,requesterId:ctx.user.id,proposedExpiryDate:accepted.has("expiryDate")?accepted.get("expiryDate") as Date:undefined,proposedNoticeDays:accepted.has("contractualNoticeDays")?accepted.get("contractualNoticeDays") as number:undefined,reason:`Lease Intelligence review of ${document.filename} found legal terms that differ from the locked contractual record.`}});
     amendmentId=a.id;
    }else amendmentId=pending.id;
   }
   await tx.leaseDocument.update({where:{id},data:{status:"CONFIRMED"}});
   await tx.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"LeaseDocument",entityId:id,action:"EXTRACTION_REVIEWED",afterJson:{fields:[...accepted.keys()],contractualTermsLocked:locked,legalAmendmentCreated:!!amendmentId}}});
  });

  return NextResponse.json({ok:true,leaseId:document.leaseId,contractualTermsLocked:true,legalAmendmentId:amendmentId});
 }catch(e){return apiError(e)}
}
