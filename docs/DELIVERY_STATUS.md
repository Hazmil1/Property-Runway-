# Property Runway delivery status

## Implemented source
Separate property register, freehold/leasehold tenure, multiple linked leases, managers, search/tenure/archive filters, confirmed property events and runway dates, private documents, lease review, decisions, approvals, actions, reporting, audit, organisation-scoped access, notification acknowledgement and optional email delivery.
The full app now has an accessible mobile drawer; the standalone sample remains separate.

## Deployment preparation
render.production.yaml targets one free Render web service. No paid cron or Render database is defined.
Startup validates configuration, safely handles the pre-existing Supabase schema, migrates, bootstraps an empty workspace/private bucket and verifies readiness.
The optional daily GitHub reminder workflow skips until its URL and secret are configured.
The separate Supabase project has 19 empty application tables with RLS; server-only access is intentional. See [Supabase's RLS-no-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Validation
GitHub Actions is the source of truth: pinned install, schema drift, existing-schema baseline refusal/adoption, typecheck, unit and database tests, production build and actual property workflows in Chromium across phone/tablet/desktop widths.
The static demo additionally has its own six-width navigation checks. A pushed commit alone is not a passed check.

## Still required to activate the full application
Configure server credentials and intended owner email directly in Render; confirm Supabase Auth redirects and sign-in email. Perform live storage/authentication acceptance checks.
Email sender and extraction provider are optional and remain disabled until configured and tested. Direct property-event date edits are role-restricted/audited, not a two-person approval workflow.
No existing Contract Runway services or data are modified. The live sample uses illustrative data and sends no emails.
