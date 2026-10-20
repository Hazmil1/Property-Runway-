import { z } from "zod";
export const propertySchema=z.object({
 name:z.string().trim().min(2).max(180),reference:z.string().trim().min(1).max(80),
 address:z.string().trim().min(3).max(500),city:z.string().trim().max(120).optional(),
 postcode:z.string().trim().max(30).optional(),tenure:z.enum(["FREEHOLD","LEASEHOLD"]),
 useType:z.enum(["OFFICE","RETAIL","INDUSTRIAL","RESIDENTIAL","MIXED","LAND","OTHER"]).default("OFFICE"),
 holdingEntity:z.string().trim().max(180).optional(),managerId:z.string().optional().nullable(),
 areaSqFt:z.coerce.number().nonnegative().max(1e10).optional(),notes:z.string().trim().max(5000).optional(),
 archived:z.boolean().default(false)
});
export const propertyEventSchema=z.object({
 leaseId:z.string().optional().nullable(),type:z.enum(["BREAK","RENT_REVIEW","RENEWAL","COMPLIANCE","OTHER"]),
 title:z.string().trim().min(2).max(180),eventDate:z.coerce.date(),noticeDeadline:z.coerce.date(),
 planningDays:z.coerce.number().int().min(0).max(3650),status:z.enum(["OPEN","IN_PROGRESS","COMPLETE","CANCELLED"]).default("OPEN"),
 notes:z.string().trim().max(3000).optional()
}).refine(v=>v.noticeDeadline<=v.eventDate,{message:"Notice deadline must be on or before the event date"});
