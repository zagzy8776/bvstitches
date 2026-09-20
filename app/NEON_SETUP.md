# Neon booking database

The BV Stitches booking form writes appointments to Neon PostgreSQL.

## 1. Create the database

Create a Neon project and copy its connection string.

## 2. Run the schema

Run the SQL in:

app/db/migrations/001_bookings.sql

This creates the `bookings` table and prevents two active requests from taking the same date/time slot.

## 3. Configure the app

For local development, create `app/.dev.vars` or your local environment file with:

```
DATABASE_URL="your-neon-connection-string"
```

For the deployed Cloudflare Worker, add `DATABASE_URL` as a secret/environment variable in the deployment platform. Do not commit the real connection string.

The app uses Neon’s serverless driver, which is designed for edge/serverless runtimes such as Cloudflare Workers.
