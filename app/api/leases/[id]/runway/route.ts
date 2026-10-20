import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { changeRunway } from "@/lib/services/runway-overrides";
import { runwayOverrideSchema } from "@/lib/validation/leases";
import { apiError } from "@/lib/http";
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const ctx=await requireContext();const input=runwayOverrideSchema.parse(await req.json());return NextResponse.json(await changeRunway(ctx,id,input))}catch(e){return apiError(e)}}
