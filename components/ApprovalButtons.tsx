"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function ApprovalButtons({approvalId}:{approvalId:string}){const router=useRouter();const [busy,setBusy]=useState(false);async function act(approve:boolean){setBusy(true);await fetch(`/api/approvals/${approvalId}/decision`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({approve})});setBusy(false);router.refresh();}return <div className="approvalActions"><button className="btn" disabled={busy} onClick={()=>act(true)}>Approve</button><button className="btn secondary" disabled={busy} onClick={()=>act(false)}>Reject</button></div>}
