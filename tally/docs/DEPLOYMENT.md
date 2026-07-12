# Deployment

## Frontend (Netlify)

1. Build command: `cd tally && npm ci && npm run build`
2. Publish directory: `tally/dist`
3. SPA redirects configured in root `netlify.toml`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_ENABLE_DEMO_DATA` | Enable demo load seeding in production builds (default: off) |
| `VITE_M365_CLIENT_ID` | Azure AD app client ID for Graph email |
| `VITE_SUPABASE_URL` | Supabase project URL (Phase 4) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (Phase 4) |

## Company setup

Before sending quotes, complete **Settings → Company identity** with legal name, address, phone, reply-to email, and shipping origin.

## Microsoft 365 (Phase 4)

Register an Azure AD application with delegated `Mail.Send`. Configure redirect URI for production domain. Store client secret server-side only.

## Supabase (recommended, pending approval)

Provision Postgres, Auth, and Storage. Deploy Edge Functions for email and privileged operations.
