export type RunwayInputs={expiryDate:Date;contractualNoticeDays:number;planningRunwayDays:number;today?:Date};
export type RunwayResult={legalNoticeDate:Date;actionByDate:Date;daysUntilNotice:number;runwayDeficitDays:number;status:"ON_TRACK"|"DECISION_DUE"|"BEHIND_RUNWAY"|"NOTICE_MISSED"};
const dayMs=86_400_000;
export const addDays=(d:Date,days:number)=>new Date(d.getTime()+days*dayMs);
export const diffDays=(later:Date,earlier:Date)=>Math.ceil((later.getTime()-earlier.getTime())/dayMs);
export function calculateRunway(input:RunwayInputs):RunwayResult{
 const today=input.today??new Date();
 if(input.contractualNoticeDays<0||input.planningRunwayDays<0)throw new Error("Days cannot be negative");
 const legalNoticeDate=addDays(input.expiryDate,-input.contractualNoticeDays);
 const actionByDate=addDays(legalNoticeDate,-input.planningRunwayDays);
 const daysUntilNotice=diffDays(legalNoticeDate,today);
 const runwayDeficitDays=Math.max(0,diffDays(today,actionByDate));
 let status:RunwayResult["status"]="ON_TRACK";
 if(today>legalNoticeDate)status="NOTICE_MISSED";else if(today>actionByDate)status="BEHIND_RUNWAY";else if(diffDays(actionByDate,today)<=30)status="DECISION_DUE";
 return{legalNoticeDate,actionByDate,daysUntilNotice,runwayDeficitDays,status};
}
