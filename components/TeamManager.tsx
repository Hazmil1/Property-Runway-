"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Member={id:string;name:string;email:string;role:string;active:boolean};
const roles=["ADMIN","PROPERTY_MANAGER","PROCUREMENT","LEGAL","PROPERTY_OWNER","VIEWER"];

export function TeamManager({members,currentUserId,currentRole}:{members:Member[];currentUserId:string;currentRole:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function invite(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  const fd=new FormData(e.currentTarget);
  const res=await fetch("/api/team/invite",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(fd.entries()))});
  const data=await res.json();setBusy(false);
  if(!res.ok)return setMessage(data.error||"Invite failed");
  setMessage(data.inviteSent?"Invitation sent.":"Member provisioned. They can sign in with their work email.");
  (e.target as HTMLFormElement).reset();router.refresh();
 }
 async function updateMember(id:string,patch:Record<string,unknown>){
  setBusy(true);setMessage("");
  const res=await fetch(`/api/team/users/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(patch)});
  const data=await res.json();setBusy(false);
  if(!res.ok)return setMessage(data.error||"Update failed");
  router.refresh();
 }
 return <div className="stack">
  <form onSubmit={invite} className="formGrid">
   <label>Name<input name="name" minLength={2} maxLength={120} required placeholder="Jane Smith"/></label>
   <label>Work email<input name="email" type="email" required placeholder="jane@company.com"/></label>
   <label>Role<select name="role" defaultValue="PROPERTY_OWNER">{roles.map(r=><option key={r} value={r}>{r.replaceAll("_"," ")}</option>)}{currentRole==="OWNER"&&<option value="OWNER">OWNER</option>}</select></label>
   <div className="actions" style={{alignSelf:"end"}}><button className="btn" disabled={busy}>{busy?"Sending…":"Invite member"}</button></div>
  </form>
  {message&&<p className="mutedText">{message}</p>}
  <div className="tableWrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td>{m.name}{m.id===currentUserId&&<small>You</small>}</td><td>{m.email}</td><td>{m.id===currentUserId?m.role.replaceAll("_"," "):<select value={m.role} disabled={busy} onChange={e=>void updateMember(m.id,{role:e.target.value})}>{roles.map(r=><option key={r} value={r}>{r.replaceAll("_"," ")}</option>)}{currentRole==="OWNER"&&<option value="OWNER">OWNER</option>}</select>}</td><td><span className={`pill ${m.active?"green":"amber"}`}>{m.active?"Active":"Inactive"}</span></td><td>{m.id!==currentUserId&&<button className="btn secondary" disabled={busy} onClick={()=>void updateMember(m.id,{active:!m.active})}>{m.active?"Deactivate":"Reactivate"}</button>}</td></tr>)}</tbody></table></div>
 </div>
}
