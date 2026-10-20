import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { requireContext } from "@/lib/auth/context";
import { createLease } from "@/lib/services/leases";
import { prisma } from "@/lib/db/prisma";
import { createLeaseSchema } from "@/lib/validation/leases";
import { apiError } from "@/lib/http";

type Row=Record<string,string>;
const bool=(v:string|undefined)=>["true","yes","1","y"].includes((v??"").trim().toLowerCase());

export async function POST(req:Request){
 try{
  const ctx=await requireContext();
  const form=await req.formData();
  const file=form.get("file");
  if(!(file instanceof File)) throw new Error("CSV file is required");
  if(file.size>10*1024*1024) throw new Error("CSV file must be 10 MB or smaller");
  const text=await file.text();
  const rows=parse(text,{columns:true,skip_empty_lines:true,trim:true,bom:true}) as Row[];
  let created=0,failed=0;const errors:{row:number;message:string}[]=[];
  for(let i=0;i<rows.length;i++){
   const r=rows[i];
   try{
    const name=r.name||r.lease||r.leaseName;
    const supplierName=r.supplier||r.supplierName;
    const expiryRaw=r.expiryDate||r.expiry;
    if(!name||!supplierName||!expiryRaw) throw new Error("name, supplier and expiryDate are required");
    const expiryDate=new Date(expiryRaw);
    if(Number.isNaN(expiryDate.getTime())) throw new Error("expiryDate is invalid");
    const property=await prisma.property.findFirst({where:{organisationId:ctx.organisation.id,reference:r.propertyReference,archived:false}});
    if(!r.propertyReference||!property)throw new Error("A valid propertyReference is required");
    await createLease(ctx,createLeaseSchema.parse({propertyId:property.id,unit:r.unit||undefined,direction:r.direction||"TENANT",
      name,
      supplierName,
      value:r.value?Number(r.value.replace(/[,£$€]/g,"")):undefined,
      currency:(r.currency||"GBP").toUpperCase().slice(0,3),
      expiryDate,
      contractualNoticeDays:Number(r.noticeDays||r.contractualNoticeDays||90),
      planningRunwayDays:Number(r.runwayDays||r.planningRunwayDays||180),
      category:r.category||null,
      reference:r.reference||null,
      autoRenews:bool(r.autoRenews||r.autoRenewal)
    }));
    created++;
   }catch(e){failed++;errors.push({row:i+2,message:e instanceof Error?e.message:"Import failed"})}
  }
  return NextResponse.json({created,failed,errors:errors.slice(0,50)});
 }catch(e){return apiError(e)}
}
