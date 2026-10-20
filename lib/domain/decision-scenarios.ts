import { calculateFeasibility } from "./feasibility";

export type ScenarioDecision="RENEW"|"RENEGOTIATE"|"RELOCATE"|"EXTEND"|"TERMINATE";
export type DecisionScenario={
 decision:ScenarioDecision;
 label:string;
 processDays:number;
 feasibility:ReturnType<typeof calculateFeasibility>;
 operationalImpact:string;
 commercialImpact:string;
 nextStep:string;
};

const DEFAULT_PROCESS_DAYS:Record<ScenarioDecision,number>={
 RENEW:45,
 RENEGOTIATE:90,
 RELOCATE:210,
 EXTEND:30,
 TERMINATE:60
};

export function buildDecisionScenarios(input:{
 legalNoticeDate:Date;
 planningRunwayDays:number;
 today?:Date;
 tenderPlanDays?:number|null;
}):DecisionScenario[]{
 const today=input.today??new Date();
 const processDays:Record<ScenarioDecision,number>={
  ...DEFAULT_PROCESS_DAYS,
  RELOCATE:input.tenderPlanDays&&input.tenderPlanDays>0?input.tenderPlanDays:Math.max(DEFAULT_PROCESS_DAYS.RELOCATE,input.planningRunwayDays)
 };
 const meta:Record<ScenarioDecision,Omit<DecisionScenario,"decision"|"processDays"|"feasibility">>={
  RENEW:{label:"Renew",operationalImpact:"Lowest transition effort if the incumbent remains suitable.",commercialImpact:"Preserves continuity but may reduce competitive tension if not benchmarked.",nextStep:"Confirm performance, benchmark commercials and secure renewal authority."},
  RENEGOTIATE:{label:"Renegotiate",operationalImpact:"Moderate effort with incumbent engagement and internal approval.",commercialImpact:"Creates scope to improve price, terms or service without a full market exercise.",nextStep:"Define negotiation objectives, fallback position and approval limits."},
  RELOCATE:{label:"Relocate",operationalImpact:"Highest workload: specification, approvals, sourcing, award and mobilisation.",commercialImpact:"Creates strongest market tension but needs the most runway.",nextStep:"Start or refresh the tender plan immediately and assign phase owners."},
  EXTEND:{label:"Use extension",operationalImpact:"Low short-term disruption where a valid extension option exists.",commercialImpact:"Buys time but can defer rather than solve the underlying commercial decision.",nextStep:"Validate the extension right, pricing mechanism and approval requirement."},
  TERMINATE:{label:"Terminate",operationalImpact:"Requires exit, transition and service-continuity planning.",commercialImpact:"Stops future commitment but may create exit cost or replacement demand.",nextStep:"Validate termination rights, exit obligations and continuity plan."}
 };
 return (Object.keys(processDays) as ScenarioDecision[]).map(decision=>({
  decision,
  processDays:processDays[decision],
  feasibility:calculateFeasibility({legalNoticeDate:input.legalNoticeDate,requiredDays:processDays[decision],today}),
  ...meta[decision]
 }));
}
