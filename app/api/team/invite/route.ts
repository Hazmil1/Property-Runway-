import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { assertCanAdminister } from "@/lib/auth/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/http";

const schema=z.object({
 name:z.string().trim().min(2).max(120),
 email:z.string().trim().email().transform(v=>v.toLowerCase()),
 role:z.enum(["OWNER","ADMIN","PROPERTY_MANAGER","PROCUREMENT","LEGAL","PROPERTY_OWNER","VIEWER"])
});

async function findAuthUserIdByEmail(email:string){
 const admin=createSupabaseAdminClient();
 for(let page=1;page<=10;page++){
  const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
  if(error)throw error;
  const hit=data.users.find(u=>u.email?.toLowerCase()===email);
  if(hit)return hit.id;
  if(data.users.length<1000)break;
 }
 return undefined;
}

export async function POST(req:Request){
 try{
  const ctx=await requireContext();assertCanAdminister(ctx);
  const input=schema.parse(await req.json());
  if(input.role==="OWNER"&&ctx.user.role!=="OWNER")throw new Error("Only a workspace owner can assign the Owner role");
  const admin=createSupabaseAdminClient();const appUrl=process.env.NEXT_PUBLIC_APP_URL;if(!appUrl)throw new Error("NEXT_PUBLIC_APP_URL is not configured");

  const {data,error}=await admin.auth.admin.inviteUserByEmail(input.email,{redirectTo:appUrl});
  const alreadyExists=!!error&&/already|registered|exists/i.test(error.message);
  if(error&&!alreadyExists)throw error;
  const authUserId=data?.user?.id??(alreadyExists?await findAuthUserIdByEmail(input.email):undefined);

  if(authUserId){
   const conflicting=await prisma.user.findFirst({where:{authUserId,NOT:{organisationId:ctx.organisation.id}}});
   if(conflicting)throw new Error("This Supabase account is already bound to another Property Runway workspace");
  }

  const member=await prisma.user.upsert({
   where:{organisationId_email:{organisationId:ctx.organisation.id,email:input.email}},
   update:{name:input.name,role:input.role,active:true,...(authUserId?{authUserId}:{})},
   create:{organisationId:ctx.organisation.id,name:input.name,email:input.email,role:input.role,active:true,authUserId}
  });

  await prisma.auditEvent.create({data:{
   organisationId:ctx.organisation.id,userId:ctx.user.id,entityType:"User",entityId:member.id,
   action:alreadyExists?"MEMBER_PROVISIONED":"MEMBER_INVITED",
   afterJson:{email:member.email,role:member.role,active:member.active,authBound:!!member.authUserId}
  }});
  return NextResponse.json({memberId:member.id,inviteSent:!error,authBound:!!member.authUserId});
 }catch(e){return apiError(e)}
}
