# Property Runway
Standalone property and lease lifecycle operations, built from the Contract Runway v0.12 application baseline.

## What is in this repository
- Next.js / React / TypeScript application; Prisma and PostgreSQL data layer.
- Organisation-scoped access, Supabase passwordless authentication and provisioned team roles.
- Freehold / leasehold property register, property manager assignment, linked head and occupational leases.
- Breaks, rent reviews, renewals and other property events with explicit notice deadlines and planning dates.
- Lease decisions and scenario planning, relocation milestones, tasks, approval workflows and legal amendments.
- Private lease and property documents. Extraction adapter with evidence review; production requires a real provider.
- In-app and optional Resend email notifications, escalation and acknowledgement; optional daily GitHub reminder schedule.
- Audit history, portfolio reports, CSV lease import and export.
- Public, isolated sample concept demo at /demo.html. Demo mode blocks all live application APIs.
- Initial checked-in SQL migration with RLS enabled, unit and database integration tests, GitHub Actions verification.

This is the first adapted implementation. It is not a declaration of production readiness or proven feature parity. See docs/DELIVERY_STATUS.md for validation and setup requirements.

## Concept demo on Render
The default render.yaml deploys a static sample-only demo to Render's CDN. It validates its standalone HTML and scripts without installing the full app dependencies. No database or credentials are needed.
Use the GitHub Actions verification result before deploying.
The demo's interactions and displayed figures are illustrative; they do not create live records, connect integrations or send emails.

## Full application setup
Use a **dedicated Supabase project/database**, separate from Contract Runway. This repository owns its own tables and migrations.
1. Configure .env using .env.example. Never commit credentials.
2. npm ci
3. npm run db:generate
4. npm run db:prepare (see deployment guide for an already-created schema)
5. npm run db:bootstrap
6. Configure a private property-documents bucket in Supabase and the passwordless email template /auth/confirm.
7. Set BOOTSTRAP_OWNER_EMAIL to the initial owner's verified work email. First login provisions that account only.
8. For local sample data only: npm run db:seed, then ALLOW_DEV_AUTH=true, DEV_ORG_SLUG=acme-demo, DEV_USER_EMAIL=owner@example.com.
9. npm run dev

Production must set ALLOW_DEV_AUTH=false and DEMO_ONLY=false. The runtime additionally refuses development authentication when NODE_ENV=production.
render.production.yaml describes one free web application, with no paid cron or database. It is **not applied automatically** by the demo Blueprint.
Startup checks credentials, prepares the schema, bootstraps the workspace and private bucket, and verifies readiness. See [the deployment guide](docs/DEPLOY_RENDER_SUPABASE.md). The optional GitHub reminder workflow skips until configured; a verified email sender is required before enabling email delivery.
AI_EXTRACTION_MODE=disabled keeps manual property/lease entry available without an AI provider. Use webhook with a configured provider for real document extraction. Mock extraction is for local development only.

## Verification
npm run db:generate
npm run db:migrate
npm run db:check
npm run typecheck
npm test
npm run build

GitHub Actions verifies clean and existing-schema preparation, drift rejection, unit tests, cross-organisation checks, production build and browser property creation/events/search at phone, tablet and desktop widths against ephemeral PostgreSQL.
Direct package versions are pinned in package.json. The committed lock is installed with npm ci; dependency changes must update it explicitly.

## Lease CSV import
Create properties first. Each row needs propertyReference, name, supplier, expiryDate, noticeDays, runwayDays.
Optional columns include unit, direction (TENANT / LANDLORD), value (annual rent), currency, category, reference, autoRenews.
Dates should use YYYY-MM-DD. Import reports row errors; already-created rows are retained if later rows fail.

## Governance and limits
Lease expiry and notice amendments use the legal amendment workflow. Material runway reductions require approval. Requesters cannot approve their own pending amendment or runway request.
Property-event legal date changes require an OWNER / ADMIN / LEGAL role and a recorded reason; they are audited directly rather than queued for a second approval.
Property managers are provisioned application users; contacts do not automatically gain access.
The demo and production environments must remain separate. The earlier Sites concept is a separate deployment and has not been migrated into this database.
