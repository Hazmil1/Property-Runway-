import { diffDays } from "./runway";

export type FeasibilityStatus="FEASIBLE"|"TIGHT"|"DEFICIT"|"NOTICE_MISSED";
export type FeasibilityResult={
 daysAvailable:number;
 requiredDays:number;
 bufferDays:number;
 deficitDays:number;
 utilisation:number;
 status:FeasibilityStatus;
};

export function calculateFeasibility(input:{legalNoticeDate:Date;requiredDays:number;today?:Date}):FeasibilityResult{
 const today=input.today??new Date();
 if(input.requiredDays<0)throw new Error("Required days cannot be negative");
 const rawAvailable=diffDays(input.legalNoticeDate,today);
 const daysAvailable=Math.max(0,rawAvailable);
 const bufferDays=daysAvailable-input.requiredDays;
 const deficitDays=Math.max(0,-bufferDays);
 const utilisation=input.requiredDays===0?0:input.requiredDays/Math.max(daysAvailable,1);
 let status:FeasibilityStatus;
 if(rawAvailable<0)status="NOTICE_MISSED";
 else if(deficitDays>0)status="DEFICIT";
 else if(bufferDays<=30)status="TIGHT";
 else status="FEASIBLE";
 return{daysAvailable,requiredDays:input.requiredDays,bufferDays,deficitDays,utilisation,status};
}
