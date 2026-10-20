"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function TaskStatusButton({taskId,status}:{taskId:string;status:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);
 async function setStatus(next:string){setBusy(true);const r=await fetch(`/api/tasks/${taskId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});setBusy(false);if(r.ok)router.refresh()}
 if(status==="DONE"||status==="CANCELLED")return <span className="pill green">{status.replaceAll("_"," ")}</span>;
 return <button className="btn secondary" disabled={busy} onClick={()=>setStatus("DONE")}>{busy?"Saving…":"Mark done"}</button>
}
