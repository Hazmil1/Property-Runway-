import Link from "next/link";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
export const dynamic="force-dynamic";
export default async function Onboarding(){
 const ctx=await requireContext();
 const [leases,users,documents]=await Promise.all([
  prisma.lease.count({where:{organisationId:ctx.organisation.id}}),
  prisma.user.count({where:{organisationId:ctx.organisation.id,active:true}}),
  prisma.leaseDocument.count({where:{lease:{organisationId:ctx.organisation.id}}})
 ]);
 const steps=[
  {title:"Import your lease register",desc:"Bring across your current spreadsheet so Runway can prioritise the portfolio.",done:leases>0,href:"/imports",cta:leases>0?"Review leases":"Import CSV"},
  {title:"Upload signed agreements",desc:"Attach source documents so lifecycle terms can be reviewed against evidence.",done:documents>0,href:"/leases/new",cta:documents>0?"Review documents":"Add lease"},
  {title:"Add your team",desc:"Provision lease owners, procurement and administrators before rollout.",done:users>1,href:"/settings",cta:users>1?"Manage team":"Add users"},
  {title:"Review Runway and decisions",desc:"Resolve leases that are already behind runway or approaching a legal deadline.",done:leases>0,href:"/decisions",cta:"Open decision board"},
 ];
 const complete=steps.filter(s=>s.done).length;
 return <><header className="pageHeader"><div><span className="eyebrow">Getting started</span><h1>Launch your workspace</h1><p>{complete} of {steps.length} setup milestones completed.</p></div></header><section className="panel"><div className="progressLine" style={{marginBottom:18}}><span style={{width:`${(complete/steps.length)*100}%`}}/></div>{steps.map((s,i)=><div className="leaseRow" key={s.title}><div><b>{i+1}. {s.title}</b><small>{s.desc}</small></div><div><span className={`pill ${s.done?"green":"amber"}`}>{s.done?"Complete":"To do"}</span></div><Link className="btn secondary" href={s.href}>{s.cta}</Link></div>)}</section></>
}
