import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { TeamManager } from "@/components/TeamManager";
export const dynamic="force-dynamic";
export default async function Settings(){
 const ctx=await requireContext();
 const users=await prisma.user.findMany({where:{organisationId:ctx.organisation.id},orderBy:[{active:"desc"},{role:"asc"},{name:"asc"}]});
 const canAdmin=["OWNER","ADMIN"].includes(ctx.user.role);
 return <><header className="pageHeader"><div><span className="eyebrow">Administration</span><h1>Settings</h1><p>Workspace controls, team access and production integration status.</p></div></header>
 <div className="contentGrid"><div>
  <section className="panel"><div className="panelHead"><h2>Workspace</h2></div><div className="detailGrid"><div><span>Name</span><b>{ctx.organisation.name}</b></div><div><span>Slug</span><b>{ctx.organisation.slug}</b></div><div><span>Your role</span><b>{ctx.user.role.replaceAll("_"," ")}</b></div><div><span>Authentication</span><b>{ctx.authMode==="supabase"?"Supabase Auth":"Development"}</b></div></div></section>
  <section className="panel"><div className="panelHead"><h2>Users & roles</h2><span>{users.filter(u=>u.active).length} active</span></div>{canAdmin?<TeamManager members={users.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,active:u.active}))} currentUserId={ctx.user.id} currentRole={ctx.user.role}/>:<div className="tableWrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>{users.filter(u=>u.active).map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role.replaceAll("_"," ")}</td></tr>)}</tbody></table></div>}</section>
 </div><aside>
  <section className="panel"><div className="panelHead"><h2>Runway policy</h2></div><p className="mutedText">Contractual notice remains locked. Operational runway can be changed independently, with approval required for material reductions.</p><div className="detailGrid"><div><span>Material reduction</span><b>30+ days</b></div><div><span>Privileged approvers</span><b>Owner / Admin / Estates</b></div></div></section>
  <section className="panel"><div className="panelHead"><h2>Integrations</h2></div><div className="leaseRow"><div><b>Supabase</b><small>Database, Auth and private Storage</small></div><span className={`pill ${process.env.NEXT_PUBLIC_SUPABASE_URL?"green":"amber"}`}>{process.env.NEXT_PUBLIC_SUPABASE_URL?"Configured":"Needs config"}</span><span/></div><div className="leaseRow"><div><b>Email delivery</b><small>Property manager reminders</small></div><span className={`pill ${process.env.RESEND_API_KEY?"green":"amber"}`}>{process.env.RESEND_API_KEY?"Configured":"Optional"}</span><span/></div></section>
 </aside></div></>
}
