export type PortfolioInput={
 id:string;
 category:string|null;
 ownerId:string|null;
 ownerName:string|null;
 decision:string;
 value:number;
 autoRenews:boolean;
 actionByDate:Date;
 legalNoticeDate:Date;
 updatedAt:Date;
 runwayStatus:string;
};

export type PortfolioIntelligence={
 decisionPipeline:Array<{decision:string;leases:number;value:number}>;
 categories:Array<{category:string;leases:number;value:number;behind:number}>;
 owners:Array<{ownerId:string|null;ownerName:string;leases:number;value:number;urgent:number;undecided:number}>;
 monthlyDemand:Array<{month:string;leases:number;value:number;requiredDays:number}>;
 undecidedValue:number;
 autoRenewalDue90:number;
 staleDecisions:number;
};

export function buildPortfolioIntelligence(rows:PortfolioInput[],today=new Date()):PortfolioIntelligence{
 const decisions=new Map<string,{leases:number;value:number}>();
 const categories=new Map<string,{leases:number;value:number;behind:number}>();
 const owners=new Map<string,{ownerId:string|null;ownerName:string;leases:number;value:number;urgent:number;undecided:number}>();
 const months=new Map<string,{leases:number;value:number;requiredDays:number}>();
 let undecidedValue=0,autoRenewalDue90=0,staleDecisions=0;
 for(const c of rows){
  const d=decisions.get(c.decision)??{leases:0,value:0};d.leases++;d.value+=c.value;decisions.set(c.decision,d);
  const cat=c.category||"Uncategorised";const x=categories.get(cat)??{leases:0,value:0,behind:0};x.leases++;x.value+=c.value;if(["BEHIND_RUNWAY","NOTICE_MISSED"].includes(c.runwayStatus))x.behind++;categories.set(cat,x);
  const ownerKey=c.ownerId||"unassigned";const o=owners.get(ownerKey)??{ownerId:c.ownerId,ownerName:c.ownerName||"Unassigned",leases:0,value:0,urgent:0,undecided:0};o.leases++;o.value+=c.value;if(["BEHIND_RUNWAY","NOTICE_MISSED","DECISION_DUE"].includes(c.runwayStatus))o.urgent++;if(c.decision==="UNDECIDED")o.undecided++;owners.set(ownerKey,o);
  const month=c.actionByDate.toISOString().slice(0,7);const m=months.get(month)??{leases:0,value:0,requiredDays:0};m.leases++;m.value+=c.value;m.requiredDays+=Math.max(0,Math.ceil((c.legalNoticeDate.getTime()-c.actionByDate.getTime())/86400000));months.set(month,m);
  if(c.decision==="UNDECIDED"){undecidedValue+=c.value;if((today.getTime()-c.updatedAt.getTime())/86400000>=60)staleDecisions++}
  const daysToNotice=Math.ceil((c.legalNoticeDate.getTime()-today.getTime())/86400000);if(c.autoRenews&&daysToNotice>=0&&daysToNotice<=90)autoRenewalDue90+=c.value;
 }
 return{
  decisionPipeline:[...decisions.entries()].map(([decision,v])=>({decision,...v})).sort((a,b)=>b.value-a.value),
  categories:[...categories.entries()].map(([category,v])=>({category,...v})).sort((a,b)=>b.value-a.value),
  owners:[...owners.values()].sort((a,b)=>b.urgent-a.urgent||b.value-a.value),
  monthlyDemand:[...months.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(0,12).map(([month,v])=>({month,...v})),
  undecidedValue,autoRenewalDue90,staleDecisions
 };
}
