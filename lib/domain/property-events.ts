const day=86400000;
export function propertyEventRunway(event:{eventDate:Date;noticeDeadline:Date;planningDays:number;status?:string},today=new Date()){
 const actionByDate=new Date(event.noticeDeadline.getTime()-event.planningDays*day);
 const remaining=Math.ceil((event.noticeDeadline.getTime()-today.getTime())/day);
 const status=event.status==="COMPLETE"||event.status==="CANCELLED"?"CLOSED":today>event.noticeDeadline?"NOTICE_MISSED":today>actionByDate?"BEHIND_RUNWAY":(actionByDate.getTime()-today.getTime())/day<=30?"DECISION_DUE":"ON_TRACK";
 return {actionByDate,noticeDeadline:event.noticeDeadline,eventDate:event.eventDate,daysUntilNotice:remaining,status};
}
