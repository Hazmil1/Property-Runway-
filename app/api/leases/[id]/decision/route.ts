import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { recordDecision } from "@/lib/services/leases";
import { decisionSchema } from "@/lib/validation/leases";
import { apiError } from "@/lib/http";
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const ctx=await requireContext();const input=decisionSchema.parse(await req.json());const c=await recordDecision(ctx,id,input.decision,input.note);return NextResponse.json(c)}catch(e){return apiError(e)}}
