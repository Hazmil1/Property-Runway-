import Link from "next/link";
import { requireContext } from "@/lib/auth/context";
import { listLeases } from "@/lib/services/leases";
import { StatusPill } from "@/components/StatusPill";
export const dynamic="force-dynamic";
const date=(v:Date)=>v.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});

export default async function LeasesPage({searchParams}:{searchParams:Promise<{q?:string;status?:string;decision?:string;category?:string;owner?:string;renewal?:string}>}){
 const ctx=await requireContext();const params=await searchParams;const all=await listLeases(ctx);const q=(params.q||"").trim().toLowerCase();
 const categories=[...new Set(all.map(c=>c.category).filter((x):x is string=>!!x))].sort();
 const owners=[...new Map(all.filter(c=>c.owner).map(c=>[c.owner!.id,c.owner!])).values()].sort((a,b)=>a.name.localeCompare(b.name));
 const filtered=all.filter(c=>{
  const matchesQ=!q||[c.name,c.reference,c.supplier?.name,c.category,c.owner?.name].some(v=>v?.toLowerCase().includes(q));
  const matchesStatus=!params.status||params.status==="ALL"||c.runway.status===params.status;
  const matchesDecision=!params.decision||params.decision==="ALL"||c.decision===params.decision;
  const matchesCategory=!params.category||params.category==="ALL"||c.category===params.category;
  const matchesOwner=!params.owner||params.owner==="ALL"||c.ownerId===params.owner;
  const matchesRenewal=!params.renewal||params.renewal==="ALL"||(params.renewal==="AUTO"&&c.autoRenews)||(params.renewal==="MANUAL"&&!c.autoRenews);
  return matchesQ&&matchesStatus&&matchesDecision&&matchesCategory&&matchesOwner&&matchesRenewal;
 });
 return <><header className="pageHeader"><div><span className="eyebrow">Repository</span><h1>Leases</h1><p>Search the register and prioritise by operational Runway, decision state and legal dates.</p></div><Link href="/leases/new" className="btn">+ Add lease</Link></header>
 <section className="panel"><form className="filterBar advancedFilters" method="get"><input name="q" defaultValue={params.q||""} placeholder="Search lease, supplier, reference, category or owner"/><select name="status" defaultValue={params.status||"ALL"}><option value="ALL">All runway states</option><option value="NOTICE_MISSED">Notice missed</option><option value="BEHIND_RUNWAY">Behind runway</option><option value="DECISION_DUE">Decision due</option><option value="ON_TRACK">On track</option></select><select name="decision" defaultValue={params.decision||"ALL"}><option value="ALL">All decisions</option><option value="UNDECIDED">Undecided</option><option value="RENEW">Renew</option><option value="RENEGOTIATE">Renegotiate</option><option value="RELOCATE">Relocate</option><option value="EXTEND">Extend</option><option value="TERMINATE">Terminate</option></select><select name="category" defaultValue={params.category||"ALL"}><option value="ALL">All categories</option>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select><select name="owner" defaultValue={params.owner||"ALL"}><option value="ALL">All owners</option>{owners.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select name="renewal" defaultValue={params.renewal||"ALL"}><option value="ALL">All renewal types</option><option value="AUTO">Auto-renewal</option><option value="MANUAL">No auto-renewal</option></select><button className="btn">Apply</button><Link className="btn secondary" href="/leases">Reset</Link></form>
 <div className="panelHead" style={{marginTop:18}}><div><h2>{filtered.length} leases</h2><span className="mutedText">Sorted by action-by date</span></div><Link href="/imports">Bulk import →</Link></div>
 <div className="tableWrap"><table className="table"><thead><tr><th>Lease</th><th>Supplier</th><th>Owner</th><th>Decision</th><th>Action by</th><th>Legal notice</th><th>Runway</th><th>Status</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><Link href={`/leases/${c.id}`}><b>{c.name}</b><small>{c.reference||c.category||""}</small></Link></td><td>{c.supplier?<Link href={`/suppliers/${c.supplier.id}`}>{c.supplier.name}</Link>:"—"}</td><td>{c.owner?.name||"Unassigned"}</td><td>{c.decision.replaceAll("_"," ")}</td><td>{date(c.actionByDate)}</td><td>{date(c.legalNoticeDate)}</td><td>{c.planningRunwayDays}d</td><td><StatusPill status={c.runway.status}/></td></tr>)}</tbody></table></div>
 {filtered.length===0&&<div className="empty"><h3>No matching leases</h3><p>Change the filters or add a lease.</p></div>}</section></>
}
