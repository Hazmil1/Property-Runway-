import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";

const schema=z.object({
 name:z.string().trim().min(2).max(200),
 reference:z.string().trim().max(120).optional(),
 category:z.string().trim().max(120).optional(),
 value:z.coerce.number().min(0).max(1_000_000_000_000).optional(),
 currency:z.enum(["GBP","EUR","USD"]),
 autoRenews:z.boolean()
});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const input=schema.parse(await req.json());
  const current=await prisma.lease.findFirst({where:{id,organisationId:ctx.organisation.id}});
  if(!current)throw new Error("Lease not found");
  const updated=await prisma.lease.update({where:{id},data:{name:input.name,reference:input.reference||null,category:input.category||null,value:input.value,currency:input.currency,autoRenews:input.autoRenews}});
  await prisma.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"Lease",entityId:id,action:"METADATA_UPDATED",beforeJson:{name:current.name,reference:current.reference,category:current.category,value:String(current.value??""),currency:current.currency,autoRenews:current.autoRenews},afterJson:{name:updated.name,reference:updated.reference,category:updated.category,value:String(updated.value??""),currency:updated.currency,autoRenews:updated.autoRenews}}});
  return NextResponse.json({ok:true});
 }catch(e){return apiError(e)}
}
