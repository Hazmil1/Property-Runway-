-- Initial Property Runway schema. Generated from the reviewed Prisma model snapshot.


CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'PROPERTY_MANAGER', 'PROCUREMENT', 'LEGAL', 'PROPERTY_OWNER', 'VIEWER');

CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ARCHIVED');

CREATE TYPE "LeaseDecision" AS ENUM ('UNDECIDED', 'RENEW', 'RENEGOTIATE', 'RELOCATE', 'EXTEND', 'TERMINATE');

CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED');

CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADING', 'READY', 'PROCESSING', 'REVIEW_REQUIRED', 'CONFIRMED', 'FAILED');

CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CORRECTED', 'REJECTED');

CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'TEAMS', 'SLACK');

CREATE TYPE "PropertyTenure" AS ENUM ('FREEHOLD', 'LEASEHOLD');

CREATE TABLE "Organisation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "authUserId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "strategicTier" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Lease" (
  "propertyId" TEXT,
  "unit" TEXT,
  "direction" TEXT NOT NULL DEFAULT 'TENANT',
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "supplierId" TEXT,
  "ownerId" TEXT,
  "name" TEXT NOT NULL,
  "reference" TEXT,
  "category" TEXT,
  "value" DECIMAL(18,2),
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "startDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "contractualNoticeDays" INTEGER NOT NULL,
  "planningRunwayDays" INTEGER NOT NULL,
  "legalNoticeDate" TIMESTAMP(3) NOT NULL,
  "actionByDate" TIMESTAMP(3) NOT NULL,
  "autoRenews" BOOLEAN NOT NULL DEFAULT false,
  "renewalPeriodMonths" INTEGER,
  "extensionOptions" TEXT,
  "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
  "decision" "LeaseDecision" NOT NULL DEFAULT 'UNDECIDED',
  "contractualTermsConfirmedAt" TIMESTAMP(3),
  "contractualTermsConfirmedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "LeaseDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADING',
  "extractionJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ClauseEvidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "clauseType" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "pageNumber" INTEGER,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ExtractionSuggestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "proposedValue" TEXT NOT NULL,
  "correctedValue" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL,
  "evidenceExcerpt" TEXT,
  "pageNumber" INTEGER,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RunwayOverride" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT NOT NULL,
  "previousDays" INTEGER NOT NULL,
  "newDays" INTEGER NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "justification" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
  "approvalRequestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT,
  "requesterId" TEXT NOT NULL,
  "deciderId" TEXT,
  "type" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "payload" JSONB NOT NULL,
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3)
);

CREATE TABLE "LegalAmendment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "deciderId" TEXT,
  "proposedExpiryDate" TIMESTAMP(3),
  "proposedNoticeDays" INTEGER,
  "reason" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decisionReason" TEXT
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT,
  "assigneeId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "sourceType" TEXT,
  "sourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "TenderPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNING',
  "targetAwardDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "TenderMilestone" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenderPlanId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "ownerLabel" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NotificationRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "offsetDays" INTEGER NOT NULL DEFAULT 0,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NotificationEvent" (
  "propertyEventId" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "id" TEXT NOT NULL PRIMARY KEY,
  "leaseId" TEXT,
  "userId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "eventType" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "payload" JSONB NOT NULL,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "userId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Property" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organisationId" TEXT NOT NULL,
  "managerId" TEXT,
  "name" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT,
  "postcode" TEXT,
  "tenure" "PropertyTenure" NOT NULL,
  "useType" TEXT NOT NULL DEFAULT 'OFFICE',
  "holdingEntity" TEXT,
  "areaSqFt" DECIMAL(18,2),
  "notes" TEXT,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PropertyEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "leaseId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "noticeDeadline" TIMESTAMP(3) NOT NULL,
  "planningDays" INTEGER NOT NULL DEFAULT 180,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PropertyDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

CREATE UNIQUE INDEX "User_organisationId_email_key" ON "User" ("organisationId","email");

CREATE INDEX "User_organisationId_role_idx" ON "User" ("organisationId","role");

CREATE INDEX "User_authUserId_idx" ON "User" ("authUserId");

CREATE UNIQUE INDEX "Supplier_organisationId_name_key" ON "Supplier" ("organisationId","name");

CREATE INDEX "Supplier_organisationId_idx" ON "Supplier" ("organisationId");

CREATE INDEX "Lease_organisationId_status_idx" ON "Lease" ("organisationId","status");

CREATE INDEX "Lease_organisationId_actionByDate_idx" ON "Lease" ("organisationId","actionByDate");

CREATE INDEX "Lease_organisationId_legalNoticeDate_idx" ON "Lease" ("organisationId","legalNoticeDate");

CREATE INDEX "Lease_supplierId_idx" ON "Lease" ("supplierId");

CREATE INDEX "Lease_ownerId_idx" ON "Lease" ("ownerId");

CREATE INDEX "Lease_contractualTermsConfirmedById_idx" ON "Lease" ("contractualTermsConfirmedById");

CREATE INDEX "LeaseDocument_leaseId_status_idx" ON "LeaseDocument" ("leaseId","status");

CREATE INDEX "ClauseEvidence_documentId_clauseType_idx" ON "ClauseEvidence" ("documentId","clauseType");

CREATE INDEX "ExtractionSuggestion_documentId_status_idx" ON "ExtractionSuggestion" ("documentId","status");

CREATE UNIQUE INDEX "RunwayOverride_approvalRequestId_key" ON "RunwayOverride"("approvalRequestId");

CREATE INDEX "RunwayOverride_leaseId_createdAt_idx" ON "RunwayOverride" ("leaseId","createdAt");

CREATE INDEX "RunwayOverride_createdById_idx" ON "RunwayOverride" ("createdById");

CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest" ("status","createdAt");

CREATE INDEX "ApprovalRequest_leaseId_idx" ON "ApprovalRequest" ("leaseId");

CREATE INDEX "ApprovalRequest_requesterId_idx" ON "ApprovalRequest" ("requesterId");

CREATE INDEX "ApprovalRequest_deciderId_idx" ON "ApprovalRequest" ("deciderId");

CREATE INDEX "LegalAmendment_leaseId_status_idx" ON "LegalAmendment" ("leaseId","status");

CREATE INDEX "LegalAmendment_status_createdAt_idx" ON "LegalAmendment" ("status","createdAt");

CREATE INDEX "LegalAmendment_requesterId_idx" ON "LegalAmendment" ("requesterId");

CREATE INDEX "LegalAmendment_deciderId_idx" ON "LegalAmendment" ("deciderId");

CREATE INDEX "Task_assigneeId_status_idx" ON "Task" ("assigneeId","status");

CREATE INDEX "Task_leaseId_status_idx" ON "Task" ("leaseId","status");

CREATE UNIQUE INDEX "TenderPlan_leaseId_key" ON "TenderPlan"("leaseId");

CREATE UNIQUE INDEX "TenderMilestone_tenderPlanId_order_key" ON "TenderMilestone" ("tenderPlanId","order");

CREATE INDEX "NotificationRule_leaseId_enabled_idx" ON "NotificationRule" ("leaseId","enabled");

CREATE UNIQUE INDEX "NotificationEvent_dedupeKey_key" ON "NotificationEvent"("dedupeKey");

CREATE INDEX "NotificationEvent_scheduledFor_sentAt_idx" ON "NotificationEvent" ("scheduledFor","sentAt");

CREATE INDEX "NotificationEvent_leaseId_idx" ON "NotificationEvent" ("leaseId");

CREATE INDEX "NotificationEvent_userId_idx" ON "NotificationEvent" ("userId");

CREATE INDEX "AuditEvent_organisationId_createdAt_idx" ON "AuditEvent" ("organisationId","createdAt");

CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent" ("entityType","entityId");

CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent" ("userId");

CREATE UNIQUE INDEX "Property_organisationId_reference_key" ON "Property" ("organisationId","reference");

CREATE INDEX "Property_organisationId_archived_idx" ON "Property" ("organisationId","archived");

CREATE INDEX "Property_managerId_idx" ON "Property" ("managerId");

CREATE INDEX "PropertyEvent_propertyId_eventDate_idx" ON "PropertyEvent" ("propertyId","eventDate");

CREATE INDEX "PropertyEvent_leaseId_idx" ON "PropertyEvent" ("leaseId");

CREATE UNIQUE INDEX "PropertyDocument_storageKey_key" ON "PropertyDocument"("storageKey");

CREATE INDEX "PropertyDocument_propertyId_idx" ON "PropertyDocument" ("propertyId");

ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_contractualTermsConfirmedById_fkey" FOREIGN KEY ("contractualTermsConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LeaseDocument" ADD CONSTRAINT "LeaseDocument_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClauseEvidence" ADD CONSTRAINT "ClauseEvidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LeaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExtractionSuggestion" ADD CONSTRAINT "ExtractionSuggestion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LeaseDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunwayOverride" ADD CONSTRAINT "RunwayOverride_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunwayOverride" ADD CONSTRAINT "RunwayOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RunwayOverride" ADD CONSTRAINT "RunwayOverride_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_deciderId_fkey" FOREIGN KEY ("deciderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LegalAmendment" ADD CONSTRAINT "LegalAmendment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LegalAmendment" ADD CONSTRAINT "LegalAmendment_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LegalAmendment" ADD CONSTRAINT "LegalAmendment_deciderId_fkey" FOREIGN KEY ("deciderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TenderPlan" ADD CONSTRAINT "TenderPlan_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenderMilestone" ADD CONSTRAINT "TenderMilestone_tenderPlanId_fkey" FOREIGN KEY ("tenderPlanId") REFERENCES "TenderPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_propertyEventId_fkey" FOREIGN KEY ("propertyEventId") REFERENCES "PropertyEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property" ADD CONSTRAINT "Property_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Property" ADD CONSTRAINT "Property_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyEvent" ADD CONSTRAINT "PropertyEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyEvent" ADD CONSTRAINT "PropertyEvent_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyDocument" ADD CONSTRAINT "PropertyDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Organisation" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Lease" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "LeaseDocument" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ClauseEvidence" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ExtractionSuggestion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "RunwayOverride" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "ApprovalRequest" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "LegalAmendment" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "TenderPlan" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "TenderMilestone" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "NotificationRule" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "NotificationEvent" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "PropertyEvent" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "PropertyDocument" ENABLE ROW LEVEL SECURITY;
