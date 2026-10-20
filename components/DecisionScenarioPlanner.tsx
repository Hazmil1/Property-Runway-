import type { DecisionScenario } from "@/lib/domain/decision-scenarios";

export function DecisionScenarioPlanner({scenarios,current}:{scenarios:DecisionScenario[];current:string}){
 return <div className="scenarioGrid">{scenarios.map(s=>{
  const active=current===s.decision;
  const tone=s.feasibility.status==="FEASIBLE"?"green":s.feasibility.status==="TIGHT"?"amber":"red";
  return <article className={`scenarioCard ${active?"selected":""}`} key={s.decision}>
   <div className="scenarioHead"><div><span className="eyebrow">{s.decision}</span><h3>{s.label}</h3></div>{active?<span className="pill blue">CURRENT</span>:<span className={`pill ${tone}`}>{s.feasibility.status.replaceAll("_"," ")}</span>}</div>
   <div className="scenarioMetrics"><div><span>Process</span><b>{s.processDays}d</b></div><div><span>Available</span><b>{s.feasibility.daysAvailable}d</b></div><div><span>{s.feasibility.deficitDays>0?"Deficit":"Buffer"}</span><b>{s.feasibility.deficitDays>0?`-${s.feasibility.deficitDays}d`:`+${s.feasibility.bufferDays}d`}</b></div></div>
   <p><b>Operational:</b> {s.operationalImpact}</p>
   <p><b>Commercial:</b> {s.commercialImpact}</p>
   <div className="scenarioNext"><span>Next step</span><strong>{s.nextStep}</strong></div>
  </article>
 })}</div>
}
