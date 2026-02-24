# HOA Connect Landing

Conversion-focused landing page for validating demand for HOA Connect.

## Stack

- Astro + Tailwind (AstroWind base)
- Supabase (waitlist storage + edge function)
- Resend (transactional + internal notification emails)
- Plausible (conversion analytics)
- Vercel (hosting)

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

## Frontend environment variables

Set in `.env` and Vercel project settings:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_PLAUSIBLE_DOMAIN`
- `PUBLIC_PLAUSIBLE_API_HOST` (optional, defaults to `https://plausible.io`)

## Supabase setup

1. Run migration:

```bash
supabase db push
```

2. Deploy function:

```bash
supabase functions deploy waitlist-signup --project-ref <project-ref>
```

3. Set function secrets in Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `WAITLIST_FROM_EMAIL`
- `WAITLIST_REPLY_TO_EMAIL` (optional)
- `WAITLIST_NOTIFICATION_EMAIL`

## Build

```bash
npm run build
```

## Deploy (preview)

```bash
vercel deploy -y
```
