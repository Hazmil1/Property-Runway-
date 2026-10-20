"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DecisionForm({leaseId,current}:{leaseId:string;current:string}){
 const router=useRouter();const [message,setMessage]=useState("");const [decision,setDecision]=useState(current);const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");const fd=new FormData(e.currentTarget);
  const res=await fetch(`/api/leases/${leaseId}/decision`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({decision:fd.get("decision"),note:fd.get("note")})});
  const b=await res.json();setBusy(false);setMessage(res.ok?"Decision recorded and follow-up task created.":b.error||"Unable to record decision");if(res.ok)router.refresh();
 }
 return <form onSubmit={submit} className="stack"><label>Decision<select name="decision" value={decision} onChange={e=>setDecision(e.target.value)}><option value="UNDECIDED">Undecided</option><option value="RENEW">Renew</option><option value="RENEGOTIATE">Renegotiate</option><option value="RELOCATE">Relocate</option><option value="EXTEND">Use extension</option><option value="TERMINATE">Terminate</option></select></label><label>Decision rationale<textarea name="note" minLength={decision==="UNDECIDED"?undefined:5} required={decision!=="UNDECIDED"} placeholder={decision==="UNDECIDED"?"Optional note while the decision remains open":"Why is this route being chosen? Include constraints, authority or next step."}/></label><small className="mutedText">Compare the scenario cards before committing. The rationale is written to the audit trail.</small><button className="btn secondary" disabled={busy}>{busy?"Recording…":"Record decision"}</button>{message&&<p className="formMessage">{message}</p>}</form>;
}
