import Link from "next/link";
import { requireContext } from "@/lib/auth/context";
import { listLeases } from "@/lib/services/leases";
import { portfolioSummary } from "@/lib/services/portfolio";
import { calculateFeasibility } from "@/lib/domain/feasibility";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(v);

export default async function Procurement(){
 const ctx=await requireContext();const [leases,summary]=await Promise.all([listLeases(ctx),portfolioSummary(ctx)]);
 const tender=leases.filter(c=>c.decision==="RELOCATE"||["BEHIND_RUNWAY","DECISION_DUE"].includes(c.runway.status)).map(c=>({...c,feasibility:calculateFeasibility({legalNoticeDate:c.legalNoticeDate,requiredDays:c.planningRunwayDays})}));
 const deficits=tender.filter(c=>c.feasibility.deficitDays>0);const avgUtil=tender.length?Math.round(tender.reduce((a,c)=>a+c.feasibility.utilisation,0)/tender.length*100):0;
 const demand=summary.intelligence.monthlyDemand;
 const heavy=demand.filter(m=>m.leases>=4||m.requiredDays>=360);
 const maxLoad=Math.max(1,...demand.map(m=>m.requiredDays));
 return <><header className="pageHeader"><div><span className="eyebrow">Procurement</span><h1>Procurement planner</h1><p>Forecast work from operational action dates, not last-minute expiry dates.</p></div><Link className="btn secondary" href="/reports">Portfolio reports</Link></header>
 <section className="metrics"><article><span>Demand leases</span><strong>{tender.length}</strong><small>Need procurement attention</small></article><article><span>Runway deficits</span><strong>{deficits.length}</strong><small>Process longer than time available</small></article><article><span>Average utilisation</span><strong>{avgUtil}%</strong><small>Required days ÷ available days</small></article><article><span>Heavy months</span><strong>{heavy.length}</strong><small>≥4 starts or ≥360 process-days</small></article><article><span>Largest deficit</span><strong>{deficits.length?Math.max(...deficits.map(c=>c.feasibility.deficitDays)):0}d</strong><small>Immediate intervention candidate</small></article></section>
 <section className="panel"><div className="panelHead"><div><span className="eyebrow">Capacity outlook</span><h2>12-month procurement load</h2></div><span className="mutedText">Estimated process-days starting by Action By month</span></div>{demand.length?<div className="capacityGrid">{demand.map(m=>{const overloaded=m.leases>=4||m.requiredDays>=360;return <div className={`capacityMonth ${overloaded?"overloaded":""}`} key={m.month}><div><b>{m.month}</b><span className={`pill ${overloaded?"red":"green"}`}>{overloaded?"HEAVY":"MANAGEABLE"}</span></div><strong>{m.requiredDays}d</strong><small>{m.leases} lease{m.leases===1?"":"s"} · {money(m.value)}</small><div className="progressLine"><span style={{width:`${m.requiredDays/maxLoad*100}%`}}/></div></div>})}</div>:<div className="empty"><p>No procurement demand forecast yet.</p></div>}</section>
 <div className="workGrid">{tender.map(c=><Link className="panel workCard" key={c.id} href={`/leases/${c.id}`}><div><span className="eyebrow">{c.category??"Lease"}</span><h3>{c.name}</h3><p className="mutedText">{c.supplier?.name??"No supplier"}</p></div><div><b>Action by {c.actionByDate.toLocaleDateString("en-GB")}</b><p className="mutedText">{c.planningRunwayDays} days runway · {c.feasibility.daysAvailable} days available</p></div><div className={`pill ${c.feasibility.deficitDays>0?"red":c.feasibility.bufferDays<=30?"amber":"green"}`}>{c.feasibility.deficitDays>0?`${c.feasibility.deficitDays}d deficit`:`${c.feasibility.bufferDays}d buffer`}</div><div className="progressLine"><span style={{width:`${Math.min(100,Math.round(c.feasibility.utilisation*100))}%`}}/></div></Link>)}</div></>;
}
