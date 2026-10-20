"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LegalAmendmentForm({leaseId,currentExpiry,currentNotice,locked}:{leaseId:string;currentExpiry:string;currentNotice:number;locked:boolean}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 if(!locked)return <div className="callout"><b>Contractual terms not locked yet</b><span className="mutedText">Review the source document in Lease Intelligence to confirm expiry and notice before using the amendment workflow.</span></div>;
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");const fd=new FormData(e.currentTarget);const raw=Object.fromEntries(fd.entries());
  const body:any={reason:raw.reason};
  if(raw.expiryDate&&raw.expiryDate!==currentExpiry)body.expiryDate=raw.expiryDate;
  if(raw.contractualNoticeDays&&Number(raw.contractualNoticeDays)!==currentNotice)body.contractualNoticeDays=Number(raw.contractualNoticeDays);
  const res=await fetch(`/api/leases/${leaseId}/legal-amendments`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await res.json();setBusy(false);if(!res.ok)return setMessage(data.error||"Request failed");setMessage("Legal amendment submitted for approval.");router.refresh();
 }
 return <form className="stack" onSubmit={submit}><label>Proposed expiry<input name="expiryDate" type="date" defaultValue={currentExpiry}/></label><label>Proposed contractual notice days<input name="contractualNoticeDays" type="number" min="0" max="3650" defaultValue={currentNotice}/></label><label>Reason<textarea name="reason" minLength={10} required placeholder="Explain why the contractual record needs to change and reference the supporting evidence."/></label><button className="btn" disabled={busy}>{busy?"Submitting…":"Request legal amendment"}</button>{message&&<p className="mutedText">{message}</p>}</form>
}
