import {NextResponse} from "next/server";import {prisma} from "@/lib/db/prisma";
export const dynamic="force-dynamic";
export async function GET(){if(process.env.DEMO_ONLY==="true")return NextResponse.json({ok:true,service:"property-runway",mode:"concept-demo"});try{await prisma.organisation.count();return NextResponse.json({ok:true,service:"property-runway",mode:"application"})}catch{return NextResponse.json({ok:false,service:"property-runway",error:"Database unavailable"},{status:503})}}
