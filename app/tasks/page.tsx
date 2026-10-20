import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { TaskStatusButton } from "@/components/TaskStatusButton";
export const dynamic="force-dynamic";
export default async function TasksPage(){
 const ctx=await requireContext();
 const tasks=await prisma.task.findMany({where:{OR:[{assigneeId:ctx.user.id},{lease:{organisationId:ctx.organisation.id}}],status:{not:"CANCELLED"}},include:{lease:true,assignee:true},orderBy:[{status:"asc"},{dueAt:"asc"},{createdAt:"desc"}],take:200});
 const open=tasks.filter(t=>t.status!=="DONE");
 return <><header className="pageHeader"><div><span className="eyebrow">Work management</span><h1>Tasks</h1><p>{open.length} open tasks across lease decisions, approvals and procurement activity.</p></div></header>
 <section className="panel"><div className="tableWrap"><table className="table"><thead><tr><th>Task</th><th>Lease</th><th>Owner</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td><b>{t.title}</b><small>{t.description||t.sourceType||""}</small></td><td>{t.lease?.name||"—"}</td><td>{t.assignee?.name||"Unassigned"}</td><td>{t.dueAt?t.dueAt.toLocaleDateString("en-GB"):"—"}</td><td><span className={`pill ${t.status==="DONE"?"green":t.status==="BLOCKED"?"red":"amber"}`}>{t.status.replaceAll("_"," ")}</span></td><td><TaskStatusButton taskId={t.id} status={t.status}/></td></tr>)}</tbody></table></div>{tasks.length===0&&<div className="empty"><h3>No tasks yet</h3><p>Decision changes and procurement activity create follow-up tasks automatically.</p></div>}</section></>
}
