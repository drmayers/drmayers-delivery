# Drmayers Delivery — Supabase Connected App

This is a Next.js + Supabase starter connected to the Drmayers Delivery database.

## Included

- Email/password customer registration and login
- Automatic customer profile creation
- Customer order creation
- Real orders saved to `public.orders`
- Customer order history
- Role-aware dashboard shell for customer/vendor/rider/admin
- Basic status progression for authorized vendor/rider/admin accounts
- Mobile-friendly UI

## Important security design

Public signup creates only a `customer` profile. Do not put vendor/rider/admin role selection on a public registration page.

## Supabase setup

Run `setup/02_auth_trigger_and_security.sql` in Supabase SQL Editor after the original tables are present.

Then copy `.env.example` to `.env.local` and fill in the Project URL and Publishable key from:

Supabase → Connect → Framework → Next.js

Never put a Supabase secret/service-role key in browser code.

## Run

Install Node.js 20+.

npm install
npm run dev

Then open http://localhost:3000

## Email confirmation

If email confirmation is enabled, a new customer may need to confirm their email before signing in. Supabase's default email service is intended for testing and is rate-limited; configure custom SMTP before production.

## Next production phase

- Secure vendor/rider onboarding and assignment
- Admin management screens
- Realtime order updates
- GPS/maps and delivery zones
- Delivery pricing engine
- Payments
- SMS/WhatsApp/push notifications
- Custom SMTP
- Production security audit
