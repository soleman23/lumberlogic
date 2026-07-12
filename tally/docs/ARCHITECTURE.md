# Lumber Logic Architecture

## Storage (hybrid)

- **Phase 3 (current):** localStorage + IndexedDB repository interfaces
- **Phase 4 (pending approval):** Supabase Postgres as cloud source of truth

### IndexedDB (`src/repositories/indexedDb.ts`)

Offline structured storage with export/import backup.

### Sync outbox

`SyncOutboxEntry` records pending changes for replay when connectivity returns.

## Domain layer (`src/domain/`)

Pure functions for pricing, validation, reconciliation, migrations, and import.

## Delivery (`src/services/delivery.ts`)

- **Email:** Microsoft 365 Graph API (placeholder; mailto fallback until OAuth configured)
- **PDF:** Client-generated blob from immutable quote revision
- **Share links:** Unguessable tokens with revocation support

## Security

- No secrets in frontend bundle
- Customer PII not logged
- Internal costs never on customer-facing outputs
