"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function TenderPlanButton({leaseId}:{leaseId:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [msg,setMsg]=useState("");
 async function create(){setBusy(true);setMsg("");const r=await fetch(`/api/leases/${leaseId}/tender-plan`,{method:"POST"});const j=await r.json();setBusy(false);if(!r.ok)return setMsg(j.error||"Unable to create plan");setMsg("Tender plan created.");router.refresh()}
 return <div><button className="btn secondary" disabled={busy} onClick={create}>{busy?"Creating…":"Create tender plan"}</button>{msg&&<small style={{display:"block",marginTop:6,color:"var(--muted)"}}>{msg}</small>}</div>
}
