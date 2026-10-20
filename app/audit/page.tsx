import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
export const dynamic="force-dynamic";
export default async function Audit(){
 const ctx=await requireContext();
 const events=await prisma.auditEvent.findMany({where:{organisationId:ctx.organisation.id},include:{user:true},orderBy:{createdAt:"desc"},take:200});
 return <><header className="pageHeader"><div><span className="eyebrow">Governance</span><h1>Audit log</h1><p>Who changed what, when, and why across the workspace.</p></div></header><section className="panel"><div className="tableWrap"><table className="table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Reason</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td>{e.createdAt.toLocaleString("en-GB")}</td><td>{e.user?.name??"System"}</td><td>{e.action.replaceAll("_"," ")}</td><td>{e.entityType} · {e.entityId}</td><td>{e.reason??"—"}</td></tr>)}</tbody></table></div>{events.length===0&&<div className="empty"><h3>No audit events yet</h3><p>Lease changes, decisions and approvals will appear here.</p></div>}</section></>
}
