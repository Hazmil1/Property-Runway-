"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
export function DocumentUploader({leaseId}:{leaseId:string}){
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function upload(file:File){setBusy(true);setMessage("Preparing secure upload…");try{
  const prep=await fetch("/api/documents/upload-url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({leaseId,filename:file.name,mimeType:file.type||"application/octet-stream",sizeBytes:file.size})});const payload=await prep.json();if(!prep.ok)throw new Error(payload.error||"Upload preparation failed");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error("Supabase browser credentials are not configured");const supabase=createBrowserClient(url,key);
  const {error}=await supabase.storage.from(process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_BUCKET||"property-documents").uploadToSignedUrl(payload.path,payload.token,file,{contentType:file.type||undefined});if(error)throw error;
  const confirm=await fetch("/api/documents/confirm",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({documentId:payload.documentId})});if(!confirm.ok)throw new Error("Upload completed but confirmation failed");setMessage("Uploaded securely. Extraction review is queued.");window.location.reload();
 }catch(e){setMessage(e instanceof Error?e.message:"Upload failed")}finally{setBusy(false)}}
 return <div className="uploadBox"><strong>Upload lease document</strong><span>PDF or DOCX · private storage · max 50 MB</span><label className="btn secondary fileButton">{busy?"Uploading…":"Choose document"}<input disabled={busy} type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/></label>{message&&<p className="formMessage">{message}</p>}</div>
}
