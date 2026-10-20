import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient, leaseBucket } from "@/lib/supabase/admin";

const extractedFieldSchema=z.object({
 fieldKey:z.enum(["expiryDate","contractualNoticeDays","autoRenews","startDate","renewalPeriodMonths","extensionOptions"]),
 proposedValue:z.string().min(1).max(4000),
 confidence:z.number().min(0).max(1),
 evidenceExcerpt:z.string().max(12000).optional(),
 pageNumber:z.number().int().positive().max(100000).optional()
});
const extractionPayloadSchema=z.object({fields:z.array(extractedFieldSchema).min(1).max(100)});
type ExtractedField=z.infer<typeof extractedFieldSchema>;
type ExtractionPayload=z.infer<typeof extractionPayloadSchema>;

function mockExtraction(lease:{expiryDate:Date;contractualNoticeDays:number;autoRenews:boolean;renewalPeriodMonths:number|null;extensionOptions:string|null;startDate:Date|null}):ExtractionPayload{
 const fields:ExtractedField[]=[
  {fieldKey:"expiryDate",proposedValue:lease.expiryDate.toISOString().slice(0,10),confidence:.97,evidenceExcerpt:`The Agreement shall continue until ${lease.expiryDate.toLocaleDateString("en-GB")} unless terminated earlier in accordance with this Agreement.`,pageNumber:4},
  {fieldKey:"contractualNoticeDays",proposedValue:String(lease.contractualNoticeDays),confidence:.98,evidenceExcerpt:`Either party may give not less than ${lease.contractualNoticeDays} days' written notice to terminate at the end of the Term.`,pageNumber:12},
  {fieldKey:"autoRenews",proposedValue:String(lease.autoRenews),confidence:.91,evidenceExcerpt:lease.autoRenews?"The Agreement will automatically renew unless valid notice is served.":"The Agreement shall not renew automatically at the end of the Term.",pageNumber:4}
 ];
 if(lease.startDate)fields.push({fieldKey:"startDate",proposedValue:lease.startDate.toISOString().slice(0,10),confidence:.95,evidenceExcerpt:`The Services commence on ${lease.startDate.toLocaleDateString("en-GB")}.`,pageNumber:2});
 if(lease.renewalPeriodMonths)fields.push({fieldKey:"renewalPeriodMonths",proposedValue:String(lease.renewalPeriodMonths),confidence:.87,evidenceExcerpt:`Each renewal period will be ${lease.renewalPeriodMonths} months.`,pageNumber:4});
 if(lease.extensionOptions)fields.push({fieldKey:"extensionOptions",proposedValue:lease.extensionOptions,confidence:.84,evidenceExcerpt:lease.extensionOptions,pageNumber:5});
 return extractionPayloadSchema.parse({fields});
}

async function webhookExtraction(document:{storageKey:string;filename:string;mimeType:string},leaseId:string):Promise<ExtractionPayload>{
 const endpoint=process.env.AI_EXTRACTION_WEBHOOK_URL;if(!endpoint)throw new Error("AI extraction webhook is not configured");
 const supabase=createSupabaseAdminClient();const {data,error}=await supabase.storage.from(leaseBucket()).createSignedUrl(document.storageKey,300);
 if(error||!data?.signedUrl)throw error??new Error("Unable to create extraction URL");
 const res=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json",...(process.env.AI_EXTRACTION_WEBHOOK_SECRET?{"authorization":`Bearer ${process.env.AI_EXTRACTION_WEBHOOK_SECRET}`}:{})},body:JSON.stringify({leaseId,filename:document.filename,mimeType:document.mimeType,signedUrl:data.signedUrl})});
 if(!res.ok)throw new Error(`Extraction provider returned ${res.status}`);
 return extractionPayloadSchema.parse(await res.json());
}

export async function extractDocument(documentId:string){
 const document=await prisma.leaseDocument.findUnique({where:{id:documentId},include:{lease:true}});if(!document)throw new Error("Document not found");
 await prisma.leaseDocument.update({where:{id:documentId},data:{status:"PROCESSING"}});
 try{
  if(process.env.NODE_ENV==="production"&&process.env.AI_EXTRACTION_MODE!=="webhook")throw new Error("Document extraction provider is not configured");
  const payload=(process.env.AI_EXTRACTION_MODE||"mock")==="webhook"?await webhookExtraction(document,document.leaseId):mockExtraction(document.lease);
  await prisma.$transaction(async tx=>{
   // Preserve reviewed evidence/history. Only stale, unreviewed suggestions are
   // replaced when a user deliberately reruns extraction.
   await tx.extractionSuggestion.deleteMany({where:{documentId,status:"PENDING"}});
   for(const field of payload.fields){
    await tx.extractionSuggestion.create({data:{documentId,fieldKey:field.fieldKey,proposedValue:field.proposedValue,confidence:field.confidence,evidenceExcerpt:field.evidenceExcerpt,pageNumber:field.pageNumber}});
    if(field.evidenceExcerpt)await tx.clauseEvidence.create({data:{documentId,clauseType:field.fieldKey,excerpt:field.evidenceExcerpt,pageNumber:field.pageNumber,confidence:field.confidence}});
   }
   await tx.leaseDocument.update({where:{id:documentId},data:{status:"REVIEW_REQUIRED",extractionJson:payload}});
  });
  return payload;
 }catch(error){await prisma.leaseDocument.update({where:{id:documentId},data:{status:"FAILED"}});throw error}
}
