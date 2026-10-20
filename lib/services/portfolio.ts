import { prisma } from "@/lib/db/prisma";
import type { RequestContext } from "@/lib/auth/context";
import { calculateRunway } from "@/lib/domain/runway";
import { buildPortfolioIntelligence } from "@/lib/domain/portfolio-intelligence";

export async function portfolioSummary(ctx:RequestContext){
 const leases=await prisma.lease.findMany({
  where:{organisationId:ctx.organisation.id,status:"ACTIVE"},
  include:{supplier:true,owner:true}
 });
 let behind=0,decisionDue=0,notice90=0,autoRenewalExposure=0,valueBehind=0,totalValue=0;
 const months=new Map<string,{starts:number,value:number}>();
 const enriched=leases.map(c=>{
  const runway=calculateRunway({expiryDate:c.expiryDate,contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays});
  const v=Number(c.value??0);totalValue+=v;
  if(runway.status==="BEHIND_RUNWAY"||runway.status==="NOTICE_MISSED"){behind++;valueBehind+=v}
  if(runway.status==="DECISION_DUE")decisionDue++;
  if(runway.daysUntilNotice<=90&&runway.daysUntilNotice>=0)notice90++;
  if(c.autoRenews)autoRenewalExposure+=v;
  const key=c.actionByDate.toISOString().slice(0,7);const m=months.get(key)??{starts:0,value:0};m.starts++;m.value+=v;months.set(key,m);
  return{...c,runway,value:v};
 });
 const supplierExposure=await prisma.supplier.findMany({
  where:{organisationId:ctx.organisation.id},
  include:{leases:{where:{status:"ACTIVE"},select:{value:true,actionByDate:true,expiryDate:true,contractualNoticeDays:true,planningRunwayDays:true}}}
 });
 const intelligence=buildPortfolioIntelligence(enriched.map(c=>({
  id:c.id,category:c.category,ownerId:c.ownerId,ownerName:c.owner?.name??null,decision:c.decision,value:c.value,autoRenews:c.autoRenews,
  actionByDate:c.actionByDate,legalNoticeDate:c.legalNoticeDate,updatedAt:c.updatedAt,runwayStatus:c.runway.status
 })));
 return {
  counts:{leases:leases.length,behind,decisionDue,notice90},
  values:{totalValue,valueBehind,autoRenewalExposure},
  demand:[...months.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(0,12).map(([month,x])=>({month,...x})),
  suppliers:supplierExposure.map(s=>({id:s.id,name:s.name,leases:s.leases.length,value:s.leases.reduce((a,c)=>a+Number(c.value??0),0),behind:s.leases.filter(c=>["BEHIND_RUNWAY","NOTICE_MISSED"].includes(calculateRunway({expiryDate:c.expiryDate,contractualNoticeDays:c.contractualNoticeDays,planningRunwayDays:c.planningRunwayDays}).status)).length})).sort((a,b)=>b.value-a.value).slice(0,10),
  intelligence
 };
}
