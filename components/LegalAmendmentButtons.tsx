"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LegalAmendmentButtons({amendmentId}:{amendmentId:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);
 async function act(approve:boolean){setBusy(true);await fetch(`/api/legal-amendments/${amendmentId}/decision`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({approve})});setBusy(false);router.refresh()}
 return <div className="approvalActions"><button className="btn" disabled={busy} onClick={()=>void act(true)}>Approve</button><button className="btn secondary" disabled={busy} onClick={()=>void act(false)}>Reject</button></div>
}
