import {NextResponse} from "next/server";import {ZodError} from "zod";
export function apiError(error:unknown){
 if(error instanceof ZodError)return NextResponse.json({error:"Validation failed",issues:error.issues},{status:400});
 const message=error instanceof Error?error.message:"Unexpected error";
 if((error as {code?:string})?.code==="P2002")return NextResponse.json({error:"A record with that reference already exists"},{status:409});
 const safe=/not found|permission|required|must|cannot|already|different|provisioned|reason|rationale|linked|configured|manager|property|authentication/i.test(message);
 const status=/authentication|sign in/i.test(message)?401:/not found/i.test(message)?404:/permission/i.test(message)?403:safe?400:500;
 if(!safe)console.error("Request failed",error instanceof Error?error.name:"Error");
 return NextResponse.json({error:safe?message:"Unable to complete this request"},{status});
}
