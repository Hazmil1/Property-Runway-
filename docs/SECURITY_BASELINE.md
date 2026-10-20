# Property Runway security baseline

## Implemented
- Supabase Auth is authoritative in production; development identity fallback is disabled on Render.
- Every application query is scoped to the authenticated organisation.
- Admin/team mutation APIs enforce Owner/Admin permissions.
- A workspace cannot deactivate or demote its final active Owner.
- Unsafe browser API requests require same-origin Origin headers; the authenticated cron dispatch route is explicitly exempt.
- Lease documents are private and accessed with short-lived signed Supabase Storage URLs.
- Service-role credentials remain server-only.
- Lease Intelligence never applies extracted legal terms without human review.
- Material Runway reductions can require approval and changes are written to the audit log.
- Response headers deny framing, MIME sniffing, browser camera/microphone/geolocation and enable HSTS.

## Before public launch
- Baseline Prisma migrations and use prisma migrate deploy rather than db push.
- Add rate limiting at the edge for login, upload, import and mutation APIs.
- Configure enterprise SSO/SAML/SCIM and MFA policies.
- Add malware scanning/quarantine for uploaded files.
- Add immutable/exportable audit retention.
- Configure backup/restore drills, retention, data export/delete and DPA processes.
- Run tenant-isolation E2E tests and an external penetration test.
- Resolve all production dependency advisories or explicitly document accepted risk.
