"use client";
import { useState } from "react";
export function DocumentDownloadButton({documentId}:{documentId:string}){
 const [busy,setBusy]=useState(false);
 async function open(){setBusy(true);try{const r=await fetch(`/api/documents/${documentId}/download`);const j=await r.json();if(!r.ok)throw new Error(j.error||"Download unavailable");window.open(j.url,"_blank","noopener,noreferrer")}finally{setBusy(false)}}
 return <button className="btn secondary" disabled={busy} onClick={open}>{busy?"Opening…":"Open file"}</button>
}
