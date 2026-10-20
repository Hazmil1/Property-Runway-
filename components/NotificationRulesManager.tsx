"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Rule={id:string;eventType:string;offsetDays:number;channel:string;enabled:boolean};

export function NotificationRulesManager({leaseId,rules}:{leaseId:string;rules:Rule[]}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function add(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");const fd=new FormData(e.currentTarget);
  const res=await fetch(`/api/leases/${leaseId}/notification-rules`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(fd.entries()))});
  const data=await res.json();setBusy(false);if(!res.ok)return setMessage(data.error||"Could not add alert");setMessage("Alert rule added.");(e.target as HTMLFormElement).reset();router.refresh();
 }
 async function remove(id:string){
  setBusy(true);setMessage("");const res=await fetch(`/api/leases/${leaseId}/notification-rules?ruleId=${encodeURIComponent(id)}`,{method:"DELETE"});const data=await res.json();setBusy(false);if(!res.ok)return setMessage(data.error||"Could not remove alert");router.refresh();
 }
 return <div className="stack"><form onSubmit={add} className="alertRuleForm"><label>Trigger<select name="eventType" defaultValue="ACTION_BY"><option value="ACTION_BY">Action by</option><option value="LEGAL_NOTICE">Legal notice</option><option value="EXPIRY">Expiry</option></select></label><label>Days before<input name="offsetDays" type="number" min="0" max="730" defaultValue="30"/></label><label>Channel<select name="channel" defaultValue="IN_APP"><option value="IN_APP">In app</option><option value="EMAIL">Email</option></select></label><button className="btn" disabled={busy}>Add alert</button></form>{rules.map(r=><div className="notificationRule" key={r.id}><div><b>{r.eventType.replaceAll("_"," ")}</b><small>{r.offsetDays} days before · {r.channel.replaceAll("_"," ")}</small></div><button className="btn secondary" disabled={busy} onClick={()=>void remove(r.id)}>Remove</button></div>)}{rules.length===0&&<p className="mutedText">No custom alerts yet.</p>}{message&&<p className="mutedText">{message}</p>}</div>
}
