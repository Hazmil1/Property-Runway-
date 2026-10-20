import { prisma } from "@/lib/db/prisma";
import { calculateRunway } from "@/lib/domain/runway";
import type { RequestContext } from "@/lib/auth/context";
import { assertCanEditLeases } from "@/lib/auth/permissions";

const privilegedRoles = new Set(["OWNER", "ADMIN", "PROCUREMENT"]);

export async function changeRunway(ctx: RequestContext, leaseId: string, input: { newDays: number; reasonCode: string; justification: string }) {
  assertCanEditLeases(ctx);
  const lease = await prisma.lease.findFirst({ where: { id: leaseId, organisationId: ctx.organisation.id } });
  if (!lease) throw new Error("Lease not found");
  if (lease.planningRunwayDays === input.newDays) throw new Error("New runway must be different");

  const reduction = lease.planningRunwayDays - input.newDays;
  const approvalRequired = reduction >= 30 && !privilegedRoles.has(ctx.user.role);
  const calculated = calculateRunway({ expiryDate: lease.expiryDate, contractualNoticeDays: lease.contractualNoticeDays, planningRunwayDays: input.newDays });

  return prisma.$transaction(async (tx) => {
    let approvalRequestId: string | undefined;
    if (approvalRequired) {
      const approval = await tx.approvalRequest.create({
        data: {
          leaseId,
          requesterId: ctx.user.id,
          type: "RUNWAY_REDUCTION",
          payload: { previousDays: lease.planningRunwayDays, newDays: input.newDays, reasonCode: input.reasonCode, justification: input.justification },
        },
      });
      approvalRequestId = approval.id;
    } else {
      await tx.lease.update({ where: { id: leaseId }, data: { planningRunwayDays: input.newDays, actionByDate: calculated.actionByDate } });
    }

    const override = await tx.runwayOverride.create({
      data: {
        leaseId,
        previousDays: lease.planningRunwayDays,
        newDays: input.newDays,
        reasonCode: input.reasonCode,
        justification: input.justification,
        createdById: ctx.user.id,
        approvalRequired,
        approvalRequestId,
      },
    });
    await tx.auditEvent.create({
      data: {
        userId: ctx.user.id,
        organisationId: ctx.organisation.id,
        entityType: "Lease",
        entityId: leaseId,
        action: approvalRequired ? "RUNWAY_CHANGE_REQUESTED" : "RUNWAY_CHANGED",
        beforeJson: { planningRunwayDays: lease.planningRunwayDays, actionByDate: lease.actionByDate.toISOString() },
        afterJson: { planningRunwayDays: input.newDays, actionByDate: calculated.actionByDate.toISOString() },
        reason: input.justification,
      },
    });
    return { override, approvalRequired, calculated };
  });
}

export async function decideRunwayApproval(ctx: RequestContext, approvalId: string, approve: boolean, reason?: string) {
  const approval = await prisma.approvalRequest.findFirst({
    where: { id: approvalId, status: "PENDING", lease: { organisationId: ctx.organisation.id } },
    include: { lease: true, runwayOverride: true },
  });
  if (!approval || !approval.lease || !approval.runwayOverride) throw new Error("Approval request not found");
  if (!["OWNER", "ADMIN", "PROCUREMENT"].includes(ctx.user.role)) throw new Error("You do not have permission to decide this request");

  if(approval.requesterId===ctx.user.id)throw new Error("A different authorised reviewer is required");
  return prisma.$transaction(async (tx) => {
    const claimed=await tx.approvalRequest.updateMany({where:{id:approval.id,status:"PENDING"},data:{status:approve?"APPROVED":"REJECTED"}});
    if(claimed.count!==1)throw new Error("Approval already decided");
    if (approve) {
      const calculated = calculateRunway({
        expiryDate: approval.lease!.expiryDate,
        contractualNoticeDays: approval.lease!.contractualNoticeDays,
        planningRunwayDays: approval.runwayOverride!.newDays,
      });
      await tx.lease.update({ where: { id: approval.lease!.id }, data: { planningRunwayDays: approval.runwayOverride!.newDays, actionByDate: calculated.actionByDate } });
    }
    const updated = await tx.approvalRequest.update({
      where: { id: approval.id },
      data: { status: approve ? "APPROVED" : "REJECTED", deciderId: ctx.user.id, decidedAt: new Date(), decisionReason: reason },
    });
    await tx.auditEvent.create({
      data: { userId: ctx.user.id, organisationId: ctx.organisation.id, entityType: "ApprovalRequest", entityId: approval.id, action: approve ? "APPROVED" : "REJECTED", afterJson: { status: updated.status }, reason },
    });
    return updated;
  });
}
