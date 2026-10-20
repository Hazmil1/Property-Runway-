import { NextResponse } from "next/server";
import { z } from "zod";
import { requireContext } from "@/lib/auth/context";
import { decideRunwayApproval } from "@/lib/services/runway-overrides";
import { apiError } from "@/lib/http";
const schema=z.object({approve:z.boolean(),reason:z.string().optional()});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const ctx=await requireContext();const input=schema.parse(await req.json());return NextResponse.json(await decideRunwayApproval(ctx,id,input.approve,input.reason))}catch(e){return apiError(e)}}
