"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useRef,useState} from "react";
const links=[["/","Estate overview"],["/properties","Property register"],["/leases","Leases & tenancies"],["/runway","Dates & reminders"],["/properties/new","Add property"],["/onboarding","Getting started"],["/imports","Bulk lease import"],["/decisions","Estate decisions"],["/procurement","Relocation planner"],["/suppliers","Landlords & tenants"],["/reports","Reports"],["/notifications","Notifications"],["/approvals","Approvals"],["/tasks","Actions"],["/audit","Audit log"],["/settings","Team & settings"],["/demo","Sample concept demo"]];
export function AppNav(){
 const pathname=usePathname();const [open,setOpen]=useState(false);const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLElement>(null);
 function close(){setOpen(false);trigger.current?.focus();}
 useEffect(()=>{setOpen(false)},[pathname]);
 useEffect(()=>{
  if(!open)return;
  const original=document.body.style.overflow;document.body.style.overflow="hidden";
  panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  function key(e:KeyboardEvent){if(e.key==="Escape"){e.preventDefault();close()}if(e.key==="Tab"){const items=Array.from(panel.current?.querySelectorAll<HTMLElement>("button,a[href]")||[]).filter(x=>x.getClientRects().length);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
  const media=matchMedia("(min-width:761px)");const resize=()=>{if(media.matches)setOpen(false)};
  document.addEventListener("keydown",key);media.addEventListener("change",resize);
  return()=>{document.body.style.overflow=original;document.removeEventListener("keydown",key);media.removeEventListener("change",resize)};
 },[open]);
 return <><header className="mobileHeader"><button ref={trigger} className="btn secondary" aria-expanded={open} aria-controls="app-navigation" onClick={()=>setOpen(true)}>☰ Menu</button><Link href="/properties">Property Runway</Link></header>{open&&<button className="navBackdrop" aria-label="Close navigation" onClick={close}/>}<aside ref={panel} id="app-navigation" className={"sidebar"+(open?" isOpen":"")} aria-label="Main navigation"><button className="btn secondary navClose" onClick={close}>✕ Close menu</button><Link href="/properties" className="logo">Property Runway</Link><nav>{links.map(([href,label])=><Link href={href} key={href} aria-current={pathname===href?"page":undefined} onClick={()=>setOpen(false)}>{label}</Link>)}</nav><div className="sideNote"><strong>Your property estate</strong><span>Freeholds, leaseholds and the dates that matter.</span><Link href="/demo">Open sample demo ↗</Link></div></aside></>;
}
