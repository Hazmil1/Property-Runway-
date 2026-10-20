import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";
const schema=z.object({status:z.enum(["OPEN","IN_PROGRESS","BLOCKED","DONE","CANCELLED"])});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params;const ctx=await requireContext();const input=schema.parse(await req.json());
 const task=await prisma.task.findFirst({where:{id,OR:[{assigneeId:ctx.user.id},{lease:{organisationId:ctx.organisation.id}}]}});if(!task)throw new Error("Task not found");
 const updated=await prisma.task.update({where:{id},data:{status:input.status}});
 await prisma.auditEvent.create({data:{organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"Task",entityId:id,action:"TASK_STATUS_CHANGED",beforeJson:{status:task.status},afterJson:{status:updated.status}}});
 return NextResponse.json(updated);
}catch(e){return apiError(e)}}
