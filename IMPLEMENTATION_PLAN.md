# Training Yard Platform Recovery and Team Self-Service Plan

## Outcome

Deliver one reliable journey in which a coach can create an account, create or join a team, purchase hours, reserve real facility capacity, collect participant/guardian waivers, pay, reschedule or cancel, and see the same authoritative state that staff see.

## Release gates

Online checkout remains unsafe until all P0 gates pass:

1. Supabase is active and the application health endpoint confirms database, Auth, and Stripe configuration.
2. Public pages remain public after client hydration on desktop and mobile.
3. Availability is database-backed, fail-closed, capacity-aware, and protected by an atomic hold.
4. A successful payment can only exist with a durable booking/package record.
5. Webhooks are idempotent and persist user ownership, payment intent, payment status, and confirmation state.
6. Profile role, membership, waiver, Stripe IDs, and team balances cannot be changed through the browser Data API.
7. Customer cancellation can find the booking, refund the right amount, and restore team credits when applicable.

## Workstreams

### 1. Production stabilization

- Restore and verify the production Supabase project.
- Add a fail-closed `/api/health` readiness response.
- Correct Netlify trailing-slash/public-route behavior.
- Correct prerendered sign-up state and add password recovery.
- Prevent checkout when database readiness cannot be proven.

### 2. Scheduling and capacity

- Model two turf halves and four cage units as facility capacity.
- Store normalized `start_at`/`end_at` timestamps in America/Chicago.
- Make operating hours and closures database-controlled.
- Return real availability per service and duration.
- Create 30-minute payment holds atomically with an advisory transaction lock.
- Expire abandoned holds and release inventory automatically.
- Enforce capacity again at confirmation/redeem time to prevent races.

### 3. Stripe and accounting

- Validate every price and package exclusively on the server.
- Apply member pricing/entitlements on the server.
- Persist the booking before opening Checkout; fail if persistence fails.
- Handle completed, expired, failed, refunded, and subscription lifecycle events idempotently.
- Store payment intent/customer/subscription IDs and immutable payment ledger entries.
- Verify success pages from server state rather than URL presence.

### 4. Team self-service

- Add teams, coach/manager membership, invitations, participants, and packages.
- Let coaches purchase into a selected team and share package balances.
- Support 60, 90, and 120-minute practice reservations.
- Deduct and restore hours transactionally.
- Provide roster, waiver-status, bookings, balances, invoices, and secondary-coach access.

### 5. Waivers

- Version waiver documents and retain a content hash/snapshot.
- Store signer, participant, guardian relationship, timestamp, source, and consent evidence.
- Separate optional photo/video consent from liability acceptance.
- Support a Zoho Sign completion webhook and a first-party manual signature fallback.
- Require each participant or guardian signature instead of treating a coach signature as roster-wide consent.
- Obtain Iowa legal review before treating the electronic record as final legal language.

### 6. Security and privacy

- Enable RLS on every exposed table.
- Revoke browser writes to privileged profile/payment/booking columns.
- Restrict every policy by role and ownership.
- Keep service-role operations server-only.
- Authenticate Stripe-session detail responses and minimize returned personal data.
- Add rate limiting/CAPTCHA readiness for Auth and public inquiry endpoints.
- Run Supabase security and performance advisors before release.

### 7. Operations and UX

- Use one operating-hours and pricing source across site, booking, emails, and admin.
- Make inquiry delivery failures visible and persist leads before emailing.
- Schedule hourly reminders and hold cleanup on Netlify.
- Add structured operational logs and admin-visible failure states.
- Optimize hero/gallery images, keep the primary CTA above the mobile fold, and complete keyboard/screen-reader form labeling.

## Verification matrix

- Account: sign up, confirmation, duplicate email, wrong password, reset password, redirect preservation.
- Booking: every service, boundary hours, overlapping capacity, blocked time, abandoned payment, concurrent hold attempts.
- Payments: member/non-member, webhook retry, expired Checkout, refund, partial refund, failed database insert.
- Teams: invitation, second coach, package purchase, 60/90/120-minute redemption, concurrent redemption, cancellation credit restore.
- Waivers: adult, minor guardian, unsigned roster member, new waiver version, optional media consent, Zoho callback replay.
- Responsive/accessibility: 390px mobile, tablet, desktop, keyboard-only, visible focus, labels, error announcements.
- Production: build, migration verification, RLS tests, security advisors, Netlify deploy preview, then live smoke test.

## Rollout and rollback

1. Restore database and take a schema/data backup.
2. Apply additive/idempotent schema changes.
3. Deploy code with checkout kill switch still enabled.
4. Run production smoke tests using Stripe test mode.
5. Enable live checkout only after release gates pass.
6. Roll back application deploy independently; schema changes remain backward-compatible and additive.

## Administrative Operations Implementation

### Target outcome

Give staff one dependable back office for every account, team, reservation, closure, waiver, and contract. The public booking experience and the admin calendar must read the same capacity records, use America/Chicago for all operator-facing dates, and retain an auditable record of every manual action.

### Phase A — Authoritative schedule and manual reservations

- Replace the legacy booking-to-`cage-1` mapping with each booking's normalized `start_at`, `end_at`, `cage_units`, and `turf_units`.
- Make closures consume the same four-cage/two-turf capacity model as reservations.
- Support facility-wide, individual-cage, half-turf, and full-turf blocks without accidentally closing unrelated resources.
- Accept Central Time date/time fields at the API boundary and store normalized UTC instants.
- Show bookings and blocks together in the admin schedule with capacity remaining per hour.
- Let staff create a confirmed no-charge reservation for an account or team, including service, participant, contact details, and internal notes.
- Link optional blocks to the relevant account or team and keep the association visible in the schedule.

### Phase B — User and team administration

- Fix account booking-history loading and return complete waiver-override metadata.
- Add an administrator-initiated password-reset email.
- Add protected account deletion that prevents deleting the current administrator and requires an explicit confirmation value.
- Add an all-teams screen with owner/coach membership, roster, waiver completion, packages, and upcoming reservations.
- Let staff create a team, add a participant, add an existing account as coach/manager, and adjust package hours through ledger-backed records.

### Phase C — Waivers, contracts, and evidence

- Keep electronic signatures as immutable, versioned evidence with signer, participant, guardian relationship, consent, timestamp, IP/user-agent, document snapshot, and one-year expiry.
- Add a compliance register spanning account waivers, team-participant waivers, uploaded paper waivers, and contracts.
- Store uploaded PDFs/images in a private Supabase bucket; provide time-limited administrator downloads only.
- Let staff record a paper waiver for an account or participant and optionally attach the signed file.
- Let staff upload signed contracts for an account, team, or participant, with signed/expiration dates, status, signer, and notes.
- Surface missing, expired, and revoked documentation rather than relying on one profile boolean.
- Log administrative document, block, reservation, account, and team actions in an append-only audit table.

### Phase D — Release verification

- Run the production build and targeted server checks.
- Validate the migration transactionally, then apply it to the linked Supabase project.
- Run Supabase security and performance advisors after the migration.
- Exercise unauthenticated API denial, authenticated admin flows, schedule capacity math, Central Time conversion, file type/size enforcement, and mobile/desktop rendering.
- Commit the full platform recovery plus operations work on a release branch, open a pull request, merge after checks, deploy the merged commit to Netlify, and smoke-test the live site.

### Acceptance criteria

- A staff member can find any account or team and see reservations and compliance at a glance.
- A facility block reduces only the intended capacity and immediately changes public availability.
- A manually created reservation appears in both the admin schedule and the selected user/team history.
- An administrator can identify every unsigned or expired waiver and every pending/expired contract.
- Uploaded signed documents are never public and can only be downloaded through an admin-authorized, short-lived URL.
- Public and admin times match Central Time across daylight-saving transitions.
- All privileged endpoints return 401/403 to non-admin callers and all privileged tables retain RLS with no browser write grants.
