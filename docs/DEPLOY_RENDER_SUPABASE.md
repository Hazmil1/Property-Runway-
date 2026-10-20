# Deployment
The root render.yaml is a free public sample-only demonstration. It requires no database.
The full application is specified separately in render.production.yaml; it uses a new Supabase database and private property-documents bucket.
Do not apply the production configuration to Contract Runway's existing services or database.

Supply required secrets using the Render Dashboard or the connected environment-variable tool; do not paste them into source or issue bodies.
The application pre-deploy step applies checked-in Prisma migrations, bootstraps the empty property-runway organisation, then verifies storage and database readiness.
The notification service runs hourly using the same dedicated application database. A verified Resend key and sender are required for actual email delivery.
Configure Supabase Auth site URL and redirect allowlist for the application origin. The passwordless template must direct users to /auth/confirm with token_hash and type=email.

Source and tests must pass before deployment. A running demo does not prove that production authentication, storage, extraction or notifications are configured.
