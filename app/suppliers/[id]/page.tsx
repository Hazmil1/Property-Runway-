import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/lib/auth/context";
import { prisma } from "@/lib/db/prisma";
import { calculateRunway } from "@/lib/domain/runway";
import { StatusPill } from "@/components/StatusPill";

export const dynamic="force-dynamic";
const money=(v:unknown,c="GBP")=>new Intl.NumberFormat("en-GB",{style:"currency",currency:c,maximumFractionDigits:0}).format(Number(v??0));
const date=(v:Date)=>v.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

export default async function SupplierDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const ctx=await requireContext();
 const supplier=await prisma.supplier.findFirst({where:{id,organisationId:ctx.organisation.id},include:{leases:{where:{status:{not:"ARCHIVED"}},include:{owner:true},orderBy:{actionByDate:"asc"}}}});
 if(!supplier)notFound();
 const rows=supplier.leases.map(c=>({...c,runway:calculateRunway({expiryDate:c.expiryDate,contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays})}));
 const total=rows.reduce((a,c)=>a+Number(c.value??0),0);
 const behind=rows.filter(c=>["BEHIND_RUNWAY","NOTICE_MISSED"].includes(c.runway.status)).length;
 const auto=rows.filter(c=>c.autoRenews).reduce((a,c)=>a+Number(c.value??0),0);
 return <><header className="pageHeader"><div><span className="eyebrow">Supplier</span><h1>{supplier.name}</h1><p>{supplier.category??"Uncategorised"}{supplier.strategicTier?` · ${supplier.strategicTier}`:""}</p></div><Link className="btn secondary" href="/suppliers">← Suppliers</Link></header>
 <section className="metrics"><article><span>Active leases</span><strong>{rows.length}</strong><small>Recorded with this supplier</small></article><article><span>Total value</span><strong>{money(total)}</strong><small>Across active records</small></article><article><span>Behind runway</span><strong>{behind}</strong><small>Need intervention</small></article><article><span>Auto-renew exposure</span><strong>{money(auto)}</strong><small>Could renew without action</small></article><article><span>Next action</span><strong style={{fontSize:18}}>{rows[0]?date(rows[0].actionByDate):"—"}</strong><small>Earliest action-by date</small></article></section>
 <section className="panel"><div className="panelHead"><h2>Leases with {supplier.name}</h2><span>{rows.length}</span></div><div className="tableWrap"><table className="table"><thead><tr><th>Lease</th><th>Owner</th><th>Decision</th><th>Action by</th><th>Legal notice</th><th>Value</th><th>Status</th></tr></thead><tbody>{rows.map(c=><tr key={c.id}><td><Link href={`/leases/${c.id}`}><b>{c.name}</b><small>{c.reference??c.category??""}</small></Link></td><td>{c.owner?.name??"Unassigned"}</td><td>{c.decision.replaceAll("_"," ")}</td><td>{date(c.actionByDate)}</td><td>{date(c.legalNoticeDate)}</td><td>{money(c.value,c.currency)}</td><td><StatusPill status={c.runway.status}/></td></tr>)}</tbody></table></div></section></>
}