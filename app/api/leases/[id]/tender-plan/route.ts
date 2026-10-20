import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { ensureTenderPlan } from "@/lib/services/procurement";
import { apiError } from "@/lib/http";
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const ctx=await requireContext();return NextResponse.json(await ensureTenderPlan(ctx,id))}catch(e){return apiError(e)}}
