import {NextResponse} from "next/server";import {requireContext} from "@/lib/auth/context";import {listProperties,saveProperty} from "@/lib/services/properties";import {apiError} from "@/lib/http";
export async function GET(){try{return NextResponse.json(await listProperties(await requireContext()))}catch(e){return apiError(e)}}
export async function POST(req:Request){try{return NextResponse.json(await saveProperty(await requireContext(),await req.json()),{status:201})}catch(e){return apiError(e)}}
