"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function NewLeaseForm({properties,managers,propertyId}:{properties:{id:string;name:string}[];managers:{id:string;name:string}[];propertyId?:string}) {
 const router=useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const fd=new FormData(e.currentTarget);const payload=Object.fromEntries([...fd.entries()].filter(([k,v])=>k!=="startDate"||v!=="")); const res=await fetch("/api/leases",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...payload,autoRenews:fd.get("autoRenews")==="on"})});const b=await res.json();setBusy(false);if(!res.ok)return setError(b.error??"Could not create lease");router.push(`/leases/${b.id}`);router.refresh();}
 return <form onSubmit={submit} className="formGrid">
   <label>Property<select required name="propertyId" defaultValue={propertyId||""}><option value="">Select property…</option>{properties.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Unit / demise<input name="unit"/></label><label>Our role<select name="direction"><option value="TENANT">Tenant — rent payable</option><option value="LANDLORD">Landlord — rent receivable</option></select></label><label>Property manager<select name="ownerId"><option value="">Assign to me</option>{managers.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label><label className="span2">Lease name<input name="name" required placeholder="e.g. Riverside House head lease"/></label>
   <label>Landlord / counterparty<input name="supplierName" required/></label><label>Reference<input name="reference"/></label>
   <label>Annual rent (£)<input name="value" type="number" min="0" step="0.01"/></label><label>Currency<select name="currency" defaultValue="GBP"><option>GBP</option><option>EUR</option><option>USD</option></select></label>
   <label>Start date<input name="startDate" type="date"/></label><label>Expiry date<input name="expiryDate" type="date" required/></label>
   <label>Contractual notice (days)<input name="contractualNoticeDays" type="number" min="0" defaultValue="90" required/></label><label>Operational runway (days)<input name="planningRunwayDays" type="number" min="0" defaultValue="180" required/></label>
   <label>Category<input name="category" placeholder="Office, Retail, Industrial…"/></label><label className="check"><input name="autoRenews" type="checkbox"/> Auto-renews</label>
   <div className="span2 actions"><button className="btn" disabled={busy}>{busy?"Creating…":"Create lease"}</button>{error&&<span className="error">{error}</span>}</div>
 </form>;
}
