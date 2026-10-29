# Native issued login journal

Source candidate based on `5f9937d4526d137cb0a85ec3af96fd7ebeffd9dc`. No live deployment claim.

Newly signed customer sessions are returned only after a bounded native PostgreSQL receipt transaction commits with synchronous_commit=on. Identity comes from the canonical user row. Platform owners/admins are excluded at write time; Style also excludes its existing configured platform admins and the exact seeded App Store demo account. Native rows have no user foreign key, no retention deletion and contain only opaque event/actor IDs, method, timestamp and exclusion flag. Password resets and session reads do not issue native login events.

Apply the additive SQL as the existing DB owner before deploying this writer. Never backfill unknown history. The new metadata epoch must be advanced only after unique runtime image/file verification. Old dates remain partial; connection alone is not completeness. On DB/journal failure, no new token leaves the auth boundary and existing sessions remain valid.

Isolated validation: application auth boundary tests, TypeScript production build, and `PGLITE_TEST_MODULE=/existing/path/to/pglite/dist/index.js node qa/native-login-sql.mjs`. The SQL QA runs actual source queries and verifies deduplication, canonical identity, exclusion, account deletion survival, failed commit rollback, missing table, recovery epoch and RLS rejection. Optional external PostgreSQL integration tests require a separate throwaway test database and are not a live proof.

Rollback only the source commits by a normal reviewed revert. Keep additive journal/state tables and all receipts. A reverted runtime must fail the reader source contract until a new verified rollout epoch is established.
