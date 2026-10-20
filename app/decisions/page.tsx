import Link from "next/link";
import { requireContext } from "@/lib/auth/context";
import { listLeases } from "@/lib/services/leases";
import { buildDecisionScenarios } from "@/lib/domain/decision-scenarios";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(v);

export default async function Decisions(){
 const ctx=await requireContext();const leases=await listLeases(ctx);
 const enriched=leases.map(c=>({...c,scenarios:buildDecisionScenarios({legalNoticeDate:c.legalNoticeDate,planningRunwayDays:c.planningRunwayDays})}));
 const review=enriched.filter(c=>c.decision==="UNDECIDED");
 const urgent=review.filter(c=>["BEHIND_RUNWAY","NOTICE_MISSED","DECISION_DUE"].includes(c.runway.status));
 const relocateDeficit=review.filter(c=>c.scenarios.find(s=>s.decision==="RELOCATE")!.feasibility.deficitDays>0);
 const undecidedValue=review.reduce((a,c)=>a+Number(c.value??0),0);
 const groups=[
  {key:"review",title:"Needs decision",items:review},
  {key:"relocate",title:"Relocate",items:enriched.filter(c=>c.decision==="RELOCATE")},
  {key:"renew",title:"Renew / renegotiate",items:enriched.filter(c=>c.decision==="RENEW"||c.decision==="RENEGOTIATE")},
  {key:"other",title:"Extend / terminate",items:enriched.filter(c=>["EXTEND","TERMINATE"].includes(c.decision))}
 ];
 return <><header className="pageHeader"><div><span className="eyebrow">Decisions</span><h1>Decision board</h1><p>Move each lease from uncertainty to an owned commercial outcome before runway disappears.</p></div></header>
 <section className="metrics"><article><span>Needs decision</span><strong>{review.length}</strong><small>{money(undecidedValue)} unresolved value</small></article><article><span>Urgent undecided</span><strong>{urgent.length}</strong><small>Already due or behind runway</small></article><article><span>Relocate no longer fits</span><strong>{relocateDeficit.length}</strong><small>Default sourcing route has a timing deficit</small></article><article><span>Relocates chosen</span><strong>{groups[1].items.length}</strong><small>Need procurement planning</small></article><article><span>Renew / renegotiate</span><strong>{groups[2].items.length}</strong><small>Incumbent route selected</small></article></section>
 <div className="decisionBoard">{groups.map(g=><section className="panel decisionColumn" key={g.key}><div className="panelHead"><h2>{g.title}</h2><span className="pill blue">{g.items.length}</span></div>{g.items.length?g.items.slice(0,12).map(c=>{
  const relocate=c.scenarios.find(s=>s.decision==="RELOCATE")!;
  const current=c.decision==="UNDECIDED"?null:c.scenarios.find(s=>s.decision===c.decision);
  const f=current?.feasibility??relocate.feasibility;
  const tone=f.status==="FEASIBLE"?"green":f.status==="TIGHT"?"amber":"red";
  return <Link href={`/leases/${c.id}`} key={c.id} className="decisionCard"><div><b>{c.name}</b><small>{c.supplier?.name??"No supplier"} · {c.owner?.name??"Unassigned"}</small></div><div className="decisionCardMeta"><span>{money(Number(c.value??0))}</span><span className={`pill ${tone}`}>{c.decision==="UNDECIDED"?`Relocate: ${f.status.replaceAll("_"," ")}`:f.status.replaceAll("_"," ")}</span></div><small>Action by {c.actionByDate.toLocaleDateString("en-GB")} · legal notice {c.legalNoticeDate.toLocaleDateString("en-GB")}</small></Link>
 }):<div className="empty"><p>No leases in this column.</p></div>}</section>)}</div></>
}
