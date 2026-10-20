# Property Runway
Standalone property and lease lifecycle operations, built from the Contract Runway v0.12 application baseline.

## What is in this repository
- Next.js / React / TypeScript application; Prisma and PostgreSQL data layer.
- Organisation-scoped access, Supabase passwordless authentication and provisioned team roles.
- Freehold / leasehold property register, property manager assignment, linked head and occupational leases.
- Breaks, rent reviews, renewals and other property events with explicit notice deadlines and planning dates.
- Lease decisions and scenario planning, relocation milestones, tasks, approval workflows and legal amendments.
- Private lease and property documents. Extraction adapter with evidence review; production requires a real provider.
- In-app and optional Resend email notifications, escalation and acknowledgement; hourly notification job configuration.
- Audit history, portfolio reports, CSV lease import and export.
- Public, isolated sample concept demo at /demo.html. Demo mode blocks all live application APIs.
- Initial checked-in SQL migration with RLS enabled, unit and database integration tests, GitHub Actions verification.

This is the first adapted implementation. It is not a declaration of production readiness or proven feature parity. See docs/DELIVERY_STATUS.md for validation and setup requirements.

## Concept demo on Render
The default render.yaml deploys a free, demo-only service. No database or credentials are needed.
Use the GitHub Actions verification result before deploying.
The demo's interactions and displayed figures are illustrative; they do not create live records, connect integrations or send emails.

## Full application setup
Use a **dedicated Supabase project/database**, separate from Contract Runway. This repository owns its own tables and migrations.
1. Configure .env using .env.example. Never commit credentials.
2. npm install
3. npm run db:generate
4. npm run db:migrate
5. npm run db:bootstrap
6. Configure a private property-documents bucket in Supabase and the passwordless email template /auth/confirm.
7. Set BOOTSTRAP_OWNER_EMAIL to the initial owner's verified work email. First login provisions that account only.
8. For local sample data only: npm run db:seed, then ALLOW_DEV_AUTH=true, DEV_ORG_SLUG=acme-demo, DEV_USER_EMAIL=owner@example.com.
9. npm run dev

Production must set ALLOW_DEV_AUTH=false and DEMO_ONLY=false. The runtime additionally refuses development authentication when NODE_ENV=production.
render.production.yaml describes the separate application and notification cron. It is **not applied automatically** by the demo Blueprint.
Configure the same dedicated DATABASE_URL for the app and notification worker; set a verified Resend sender before enabling email rules.
AI_EXTRACTION_MODE=webhook with a configured provider is required for real document extraction. Mock extraction is for local development only.

## Verification
npm run db:generate
npm run db:migrate
npm run db:check
npm run typecheck
npm test
npm run build

GitHub Actions runs the baseline migration, drift detection, unit tests, cross-organisation integration checks and production build against an ephemeral PostgreSQL database.
The dependency lock is uploaded by CI for review and subsequent commit; direct package versions are pinned in package.json.

## Lease CSV import
Create properties first. Each row needs propertyReference, name, supplier, expiryDate, noticeDays, runwayDays.
Optional columns include unit, direction (TENANT / LANDLORD), value (annual rent), currency, category, reference, autoRenews.
Dates should use YYYY-MM-DD. Import reports row errors; already-created rows are retained if later rows fail.

## Governance and limits
Lease expiry and notice amendments use the legal amendment workflow. Material runway reductions require approval. Requesters cannot approve their own pending amendment or runway request.
Property-event legal date changes require an OWNER / ADMIN / LEGAL role and a recorded reason; they are audited directly rather than queued for a second approval.
Property managers are provisioned application users; contacts do not automatically gain access.
The demo and production environments must remain separate. The earlier Sites concept is a separate deployment and has not been migrated into this database.
