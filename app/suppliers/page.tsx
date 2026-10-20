import Link from "next/link";
import { requireContext } from "@/lib/auth/context";
import { portfolioSummary } from "@/lib/services/portfolio";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(v);
export default async function Suppliers(){const ctx=await requireContext();const s=await portfolioSummary(ctx);return <><header className="pageHeader"><div><span className="eyebrow">Suppliers</span><h1>Supplier exposure</h1><p>Concentration, value and runway risk by supplier.</p></div></header><div className="supplierGrid">{s.suppliers.map(x=><Link className="panel supplierCard" href={`/suppliers/${x.id}`} key={x.id}><span className="eyebrow">{x.leases} active leases</span><h3>{x.name}</h3><strong style={{fontSize:24}}>{money(x.value)}</strong><p className="mutedText">{x.behind? `${x.behind} lease${x.behind===1?"":"s"} behind runway`:"Portfolio on track"}</p><span className="link">Open supplier →</span></Link>)}</div></>}
