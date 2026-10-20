import { notFound } from "next/navigation";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { ExtractionReview } from "@/components/ExtractionReview";
export const dynamic="force-dynamic";
export default async function ReviewPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const ctx=await requireContext();const d=await prisma.leaseDocument.findFirst({where:{id,lease:{organisationId:ctx.organisation.id}},include:{suggestions:{where:{status:"PENDING"},orderBy:{createdAt:"asc"}},lease:true}});if(!d)notFound();return <><header className="pageHeader"><div><span className="eyebrow">Lease intelligence</span><h1>Review extracted terms</h1><p>{d.filename} · {d.lease.name}</p></div></header><ExtractionReview documentId={d.id} leaseId={d.leaseId} suggestions={d.suggestions}/></>}
