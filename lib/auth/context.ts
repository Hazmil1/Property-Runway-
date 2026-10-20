import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User, Organisation } from "@/generated/prisma/client";

export type RequestContext={user:User;organisation:Organisation;authMode:"supabase"|"development"};

export async function requireContext():Promise<RequestContext>{
 const supabase=await createSupabaseServerClient();
 if(supabase){
  const {data:{user:authUser}}=await supabase.auth.getUser();
  if(authUser?.email){
   const email=authUser.email.toLowerCase();
   let user=await prisma.user.findFirst({where:{authUserId:authUser.id,active:true},include:{organisation:true}});

   if(!user){
    const candidates=await prisma.user.findMany({where:{email,active:true,authUserId:null},include:{organisation:true},take:2});
    if(candidates.length===1){
     user=await prisma.user.update({where:{id:candidates[0].id},data:{authUserId:authUser.id},include:{organisation:true}});
     await prisma.auditEvent.create({data:{organisationId:user.organisationId,userId:user.id,entityType:"User",entityId:user.id,action:"AUTH_ID_BOUND",afterJson:{authUserId:authUser.id}}});
    }else if(candidates.length>1){
     throw new Error("This email is provisioned in more than one workspace. Ask an administrator to bind your Supabase account before signing in.");
    }
   }

   if(!user){
    const bootstrapEmail=process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
    if(bootstrapEmail&&email===bootstrapEmail){
     const organisation=await prisma.organisation.findUnique({where:{slug:"property-runway"}});
     if(organisation){
      const existingUsers=await prisma.user.count({where:{organisationId:organisation.id}});
      if(existingUsers===0){
       user=await prisma.user.create({data:{organisationId:organisation.id,authUserId:authUser.id,email,name:authUser.user_metadata?.full_name||email.split("@")[0],role:"OWNER",active:true},include:{organisation:true}});
       await prisma.auditEvent.create({data:{organisationId:organisation.id,userId:user.id,entityType:"User",entityId:user.id,action:"WORKSPACE_BOOTSTRAPPED",afterJson:{email,role:"OWNER"}}});
      }
     }
    }
   }

   if(user)return{user,organisation:user.organisation,authMode:"supabase"};
   throw new Error("Your Supabase account is authenticated but has not been provisioned into a Property Runway workspace.");
  }
 }

 if(process.env.NODE_ENV!=="production"&&process.env.ALLOW_DEV_AUTH==="true"){
  const orgSlug=process.env.DEV_ORG_SLUG;const email=process.env.DEV_USER_EMAIL;
  if(orgSlug&&email){
   const user=await prisma.user.findFirst({where:{email,organisation:{slug:orgSlug},active:true},include:{organisation:true}});
   if(user)return{user,organisation:user.organisation,authMode:"development"};
  }
 }
 throw new Error("Authentication required. Sign in or configure development authentication.");
}
