import { requireContext } from "@/lib/auth/context";
import { listLeases } from "@/lib/services/leases";

const esc=(v:unknown)=>{const s=String(v??"");return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s};

export async function GET(){
 const ctx=await requireContext();
 const rows=await listLeases(ctx);
 const headers=["Lease","Reference","Supplier","Owner","Category","Value","Currency","Decision","Runway status","Planning runway days","Action by","Legal notice","Expiry","Auto renews"];
 const data=rows.map(c=>[
  c.name,c.reference,c.supplier?.name,c.owner?.name,c.category,Number(c.value??0),c.currency,c.decision,c.runway.status,c.planningRunwayDays,
  c.actionByDate.toISOString().slice(0,10),c.legalNoticeDate.toISOString().slice(0,10),c.expiryDate.toISOString().slice(0,10),c.autoRenews?"Yes":"No"
 ]);
 const csv=[headers,...data].map(r=>r.map(esc).join(",")).join("\n");
 return new Response(csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="property-runway-portfolio-${new Date().toISOString().slice(0,10)}.csv"`,"cache-control":"no-store"}});
}
