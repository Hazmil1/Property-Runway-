import {NextResponse} from "next/server";import {prisma} from "@/lib/db/prisma";import {productionConfigProblems} from "@/lib/deployment/config";
export const dynamic="force-dynamic";
export async function GET(){
 if(process.env.DEMO_ONLY==="true")return NextResponse.json({ok:true,service:"property-runway",mode:"concept-demo"});
 if(process.env.NODE_ENV==="production"&&productionConfigProblems(process.env).length)return NextResponse.json({ok:false,service:"property-runway",error:"Configuration incomplete"},{status:503});
 try{await prisma.organisation.count();return NextResponse.json({ok:true,service:"property-runway",mode:"application"})}catch{return NextResponse.json({ok:false,service:"property-runway",error:"Database unavailable"},{status:503})}
}
