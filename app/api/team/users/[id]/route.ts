import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanAdminister } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";

const schema=z.object({
 role:z.enum(["OWNER","ADMIN","PROPERTY_MANAGER","PROCUREMENT","LEGAL","PROPERTY_OWNER","VIEWER"]).optional(),
 active:z.boolean().optional()
}).refine(v=>v.role!==undefined||v.active!==undefined,"A change is required");

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const ctx=await requireContext();assertCanAdminister(ctx);const {id}=await params;const patch=schema.parse(await req.json());
  if(id===ctx.user.id)throw new Error("You cannot change your own role or deactivate your own account here");
  const member=await prisma.user.findFirst({where:{id,organisationId:ctx.organisation.id}});
  if(!member)throw new Error("Team member not found");
  if((member.role==="OWNER"||patch.role==="OWNER")&&ctx.user.role!=="OWNER")throw new Error("Only a workspace owner can change Owner access");
  if(member.role==="OWNER"&&(patch.active===false||patch.role&&patch.role!=="OWNER")){
   const owners=await prisma.user.count({where:{organisationId:ctx.organisation.id,role:"OWNER",active:true}});
   if(owners<=1)throw new Error("A workspace must retain at least one active owner");
  }
  const updated=await prisma.user.update({where:{id},data:{role:patch.role,active:patch.active}});
  await prisma.auditEvent.create({data:{
   organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"User",entityId:id,action:"MEMBER_UPDATED",
   beforeJson:{role:member.role,active:member.active},afterJson:{role:updated.role,active:updated.active}
  }});
  return NextResponse.json({id:updated.id,role:updated.role,active:updated.active});
 }catch(e){return apiError(e)}
}
