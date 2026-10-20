import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { ApprovalButtons } from "@/components/ApprovalButtons";
import { LegalAmendmentButtons } from "@/components/LegalAmendmentButtons";
export const dynamic="force-dynamic";

export default async function Approvals(){
 const ctx=await requireContext();
 const [rows,legal]=await Promise.all([
  prisma.approvalRequest.findMany({where:{status:"PENDING",lease:{organisationId:ctx.organisation.id}},include:{lease:true,requester:true},orderBy:{createdAt:"asc"}}),
  prisma.legalAmendment.findMany({where:{status:"PENDING",lease:{organisationId:ctx.organisation.id}},include:{lease:true,requester:true},orderBy:{createdAt:"asc"}})
 ]);
 const total=rows.length+legal.length;
 return <><header className="pageHeader"><div><span className="eyebrow">Governance</span><h1>Approvals</h1><p>Controlled changes that need a second pair of eyes.</p></div><span className="pill blue">{total} pending</span></header>
 <section className="panel"><div className="panelHead"><h2>Legal amendments</h2><span>{legal.length}</span></div>{legal.length?legal.map(a=><div key={a.id} className="leaseRow"><div><b>{a.lease.name}</b><small>{a.proposedExpiryDate?`Expiry → ${a.proposedExpiryDate.toLocaleDateString("en-GB")} · `:""}{a.proposedNoticeDays!==null?`Notice → ${a.proposedNoticeDays} days · `:""}requested by {a.requester.name}</small><small>{a.reason}</small></div><div><small>{a.createdAt.toLocaleDateString("en-GB")}</small></div><LegalAmendmentButtons amendmentId={a.id}/></div>):<div className="empty"><p>No legal-term amendments waiting.</p></div>}</section>
 <section className="panel"><div className="panelHead"><h2>Operational approvals</h2><span>{rows.length}</span></div>{rows.length?rows.map(a=><div key={a.id} className="leaseRow"><div><b>{a.lease?.name??a.type}</b><small>{a.type.replaceAll("_"," ")} · requested by {a.requester.name}</small></div><div><small>{a.createdAt.toLocaleDateString("en-GB")}</small></div><ApprovalButtons approvalId={a.id}/></div>):<div className="empty"><p>No operational approvals waiting.</p></div>}</section></>
}
