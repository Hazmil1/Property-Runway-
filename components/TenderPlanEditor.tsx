"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Milestone={id:string;name:string;durationDays:number;ownerLabel:string|null;status:string};

export function TenderPlanEditor({milestones}:{milestones:Milestone[]}){
 const router=useRouter();const [busy,setBusy]=useState<string|null>(null);const [message,setMessage]=useState("");
 async function save(id:string,form:HTMLFormElement){
  setBusy(id);setMessage("");const fd=new FormData(form);
  const res=await fetch(`/api/tender-milestones/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(fd.entries()))});
  const data=await res.json();setBusy(null);if(!res.ok)return setMessage(data.error||"Update failed");setMessage("Tender milestone updated.");router.refresh();
 }
 return <div className="stack">{milestones.map(m=><form key={m.id} className="milestoneEditor" onSubmit={e=>{e.preventDefault();void save(m.id,e.currentTarget)}}><div className="milestoneMain"><input name="name" defaultValue={m.name}/><div className="milestoneFields"><label>Days<input name="durationDays" type="number" min="0" max="730" defaultValue={m.durationDays}/></label><label>Owner<input name="ownerLabel" defaultValue={m.ownerLabel??""}/></label><label>Status<select name="status" defaultValue={m.status}><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="BLOCKED">Blocked</option><option value="DONE">Done</option></select></label></div></div><button className="btn secondary" disabled={busy===m.id}>{busy===m.id?"Saving…":"Save"}</button></form>)}{message&&<p className="mutedText">{message}</p>}</div>
}
