import type { RequestContext } from "@/lib/auth/context";
import type { UserRole } from "@/generated/prisma/client";
const writeRoles=new Set<UserRole>(["OWNER","ADMIN","PROPERTY_MANAGER","PROCUREMENT","LEGAL","PROPERTY_OWNER"]);
const adminRoles=new Set<UserRole>(["OWNER","ADMIN"]);
const legalAmendRoles=new Set<UserRole>(["OWNER","ADMIN","LEGAL"]);
export function assertCanEditLeases(ctx:RequestContext){if(!writeRoles.has(ctx.user.role))throw new Error("Lease edit permission is required")}
export function assertCanAdminister(ctx:RequestContext){if(!adminRoles.has(ctx.user.role))throw new Error("Administrator permission is required")}
export function assertCanAmendLegalTerms(ctx:RequestContext){if(!legalAmendRoles.has(ctx.user.role))throw new Error("Legal-term amendment permission is required")}
export function canEditLeases(ctx:RequestContext){return writeRoles.has(ctx.user.role)}
export function canAmendLegalTerms(ctx:RequestContext){return legalAmendRoles.has(ctx.user.role)}
