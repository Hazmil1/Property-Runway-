"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
export default function LoginPage(){
 const [email,setEmail]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage("");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key){setMessage("Supabase is not configured.");setBusy(false);return}
  const supabase=createBrowserClient(url,key);
  const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${window.location.origin}/auth/confirm`}});
  setMessage(error?.message??"Check your email for a secure sign-in link.");setBusy(false);
 }
 return <div style={{maxWidth:430,margin:"80px auto"}}><section className="panel"><span className="eyebrow">Property Runway</span><h1>Sign in</h1><p className="mutedText">Use your work email. Access is limited to provisioned workspace members.</p><form className="stack" onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com"/></label><button className="btn" disabled={busy}>{busy?"Sending…":"Send secure link"}</button>{message&&<p>{message}</p>}</form></section></div>
}
