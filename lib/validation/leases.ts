import { z } from "zod";

export const createLeaseSchema = z.object({
  propertyId: z.string().min(1),
  unit:z.string().max(180).optional(),
  direction:z.enum(["TENANT","LANDLORD"]).default("TENANT"),
  name: z.string().min(2).max(180),
  supplierName: z.string().min(2).max(180),
  ownerId: z.string().optional().nullable(),
  value: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).default("GBP"),
  startDate: z.coerce.date().optional().nullable(),
  expiryDate: z.coerce.date(),
  contractualNoticeDays: z.coerce.number().int().min(0).max(3650),
  planningRunwayDays: z.coerce.number().int().min(0).max(3650),
  category: z.string().max(120).optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
  autoRenews: z.coerce.boolean().default(false),
});

export const runwayOverrideSchema = z.object({
  newDays: z.coerce.number().int().min(0).max(3650),
  reasonCode: z.string().min(2).max(80),
  justification: z.string().min(5).max(1000),
});

export const decisionSchema = z.object({
  decision: z.enum(["UNDECIDED", "RENEW", "RENEGOTIATE", "RELOCATE", "EXTEND", "TERMINATE"]),
  note: z.string().trim().max(1000).optional(),
}).superRefine((v,ctx)=>{
  if(v.decision!=="UNDECIDED" && (!v.note || v.note.length<5)){
    ctx.addIssue({code:"custom",path:["note"],message:"Add a short rationale for the recorded decision"});
  }
});
