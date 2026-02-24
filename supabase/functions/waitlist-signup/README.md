# waitlist-signup Edge Function

Accepts `POST /functions/v1/waitlist-signup` payloads from the landing page and stores signups in `public.waitlist_signups`.

## Required Supabase secrets

Set these in your Supabase project for the function:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional, but required for emails)
- `WAITLIST_FROM_EMAIL` (optional)
- `WAITLIST_REPLY_TO_EMAIL` (optional)
- `WAITLIST_NOTIFICATION_EMAIL` (optional)

## Deploy

```bash
supabase functions deploy waitlist-signup --project-ref <your-project-ref>
```

## Local test

```bash
supabase functions serve waitlist-signup --env-file ./supabase/.env.local
```
