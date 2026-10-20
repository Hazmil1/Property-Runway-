"use client";
import { useState } from "react";

export function CsvImport(){
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  async function upload(file:File){
    setBusy(true);setMsg("Importing…");
    const fd=new FormData();fd.set("file",file);
    const res=await fetch("/api/imports/leases",{method:"POST",body:fd});
    const j=await res.json();
    setMsg(res.ok ? `Imported ${j.created} leases${j.failed ? `; ${j.failed} rows need review` : ""}.` : (j.error||"Import failed"));
    setBusy(false);
  }
  return <div className="uploadBox"><strong>Bulk import leases</strong><span>CSV columns: name, supplier, expiryDate, noticeDays, runwayDays, value, currency, category, reference</span><label className="btn secondary fileButton">{busy?"Importing…":"Choose CSV"}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/></label>{msg&&<p className="formMessage">{msg}</p>}</div>
}
