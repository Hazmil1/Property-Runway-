"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function RunwayOverrideForm({ leaseId, currentDays }: { leaseId: string; currentDays: number }) {
  const router = useRouter();
  const [days, setDays] = useState(currentDays);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(e.currentTarget);
    const res = await fetch(`/api/leases/${leaseId}/runway`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ newDays: days, reasonCode: data.get("reasonCode"), justification: data.get("justification") }) });
    const body = await res.json(); setBusy(false);
    if (!res.ok) return setMessage(body.error ?? "Unable to change runway");
    setMessage(body.approvalRequired ? "Submitted for approval." : "Runway updated.");
    router.refresh();
  }
  return <form onSubmit={submit} className="stack">
    <label>Planning runway (days)<input type="number" min="0" max="3650" value={days} onChange={e=>setDays(Number(e.target.value))}/></label>
    <label>Reason<select name="reasonCode" defaultValue="TENDER"><option value="TENDER">Tender / procurement</option><option value="APPROVALS">Internal approvals</option><option value="TRANSITION">Supplier transition</option><option value="FRAMEWORK">Framework / faster route</option><option value="OTHER">Other</option></select></label>
    <label>Justification<textarea name="justification" required minLength={5} defaultValue="Adjusted to reflect the operational procurement plan." /></label>
    <button className="btn" disabled={busy}>{busy ? "Saving…" : "Update runway"}</button>
    {message && <p className="formMessage">{message}</p>}
  </form>;
}
