"use client";
import { useState } from "react";

export function LeaseEditForm({lease}:{lease:{id:string;name:string;reference:string|null;category:string|null;value:unknown;currency:string;autoRenews:boolean}}){
 const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);const fd=new FormData(e.currentTarget);
  const res=await fetch(`/api/leases/${lease.id}/update`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...Object.fromEntries(fd.entries()),autoRenews:fd.get("autoRenews")==="on"})});
  const j=await res.json();setMsg(res.ok?"Lease metadata updated.":j.error||"Update failed");setBusy(false);if(res.ok)window.location.reload();
 }
 return <form className="formGrid compactForm" onSubmit={submit}><div className="span2 callout"><b>Contractual dates are governed separately</b><span className="mutedText">Expiry and notice cannot be edited here after confirmation. Use the Legal amendment workflow for contractual changes and Adjust Runway™ for operational planning.</span></div><label className="span2">Name<input name="name" defaultValue={lease.name}/></label><label>Reference<input name="reference" defaultValue={lease.reference??""}/></label><label>Category<input name="category" defaultValue={lease.category??""}/></label><label>Value<input name="value" type="number" min="0" step="0.01" defaultValue={Number(lease.value??0)}/></label><label>Currency<select name="currency" defaultValue={lease.currency}><option>GBP</option><option>EUR</option><option>USD</option></select></label><label className="check"><input name="autoRenews" type="checkbox" defaultChecked={lease.autoRenews}/> Auto-renews</label><div className="span2 actions"><button className="btn" disabled={busy}>{busy?"Saving…":"Save lease metadata"}</button>{msg&&<span className="formMessage">{msg}</span>}</div></form>;
}
