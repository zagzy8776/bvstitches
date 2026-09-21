# Neon booking database

The BV Stitches booking form writes appointments to Neon PostgreSQL.

## 1. Create the database

Create a Neon project and copy its connection string.

## 2. Run the schema

```bash
cd app
npm run db:migrate
```

`scripts/apply-migrations.mjs` applies every file in `app/db/migrations/` in
lexical order, reading `DATABASE_URL` from `.env` (or from the environment).
`001_bookings.sql` creates the `bookings` table plus a partial unique index that
stops two active requests from claiming the same date/time slot.

Migrations are additive and use `if not exists`, so re-running is safe. The
script prints each statement and finishes with the list of public tables, so you
can confirm it actually landed.

## 3. Configure the app

For local development, put the connection string in `app/.env` (gitignored):

```
DATABASE_URL="your-neon-connection-string"
```

For the deployed Worker, add `DATABASE_URL` as a secret/environment variable in
the deployment platform. Do not commit the real connection string.

The app uses Neon’s serverless driver, which is designed for edge/serverless runtimes such as Cloudflare Workers.
