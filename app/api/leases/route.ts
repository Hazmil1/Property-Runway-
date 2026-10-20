import { NextResponse } from "next/server";
import { requireContext } from "@/lib/auth/context";
import { createLease, listLeases } from "@/lib/services/leases";
import { createLeaseSchema } from "@/lib/validation/leases";
import { apiError } from "@/lib/http";
export async function GET(){try{const ctx=await requireContext();return NextResponse.json(await listLeases(ctx))}catch(e){return apiError(e)}}
export async function POST(req:Request){try{const ctx=await requireContext();const input=createLeaseSchema.parse(await req.json());const c=await createLease(ctx,input);return NextResponse.json(c,{status:201})}catch(e){return apiError(e)}}
