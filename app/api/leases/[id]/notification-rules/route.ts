import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanEditLeases } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";

const createSchema=z.object({eventType:z.enum(["ACTION_BY","LEGAL_NOTICE","EXPIRY"]),offsetDays:z.coerce.number().int().min(0).max(730),channel:z.enum(["IN_APP","EMAIL"])});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const input=createSchema.parse(await req.json());
  const lease=await prisma.lease.findFirst({where:{id,organisationId:ctx.organisation.id}});if(!lease)throw new Error("Lease not found");
  const rule=await prisma.notificationRule.create({data:{leaseId:id,...input}});
  await prisma.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"NotificationRule",entityId:rule.id,action:"NOTIFICATION_RULE_CREATED",afterJson:input}});
  return NextResponse.json(rule,{status:201});
 }catch(e){return apiError(e)}
}

export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const ctx=await requireContext();assertCanEditLeases(ctx);const ruleId=new URL(req.url).searchParams.get("ruleId");if(!ruleId)throw new Error("ruleId is required");
  const rule=await prisma.notificationRule.findFirst({where:{id:ruleId,leaseId:id,lease:{organisationId:ctx.organisation.id}}});if(!rule)throw new Error("Notification rule not found");
  await prisma.notificationRule.delete({where:{id:rule.id}});
  await prisma.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"NotificationRule",entityId:rule.id,action:"NOTIFICATION_RULE_DELETED",beforeJson:{eventType:rule.eventType,offsetDays:rule.offsetDays,channel:rule.channel}}});
  return NextResponse.json({ok:true});
 }catch(e){return apiError(e)}
}
