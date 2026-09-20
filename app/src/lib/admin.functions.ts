import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

type AdminSession = {
  authenticated?: boolean;
};

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function useAdminSession() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("Admin session is not configured. Add a strong ADMIN_SESSION_SECRET.");
  }

  return useSession<AdminSession>({
    name: "bv-admin-session",
    password,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 8 * 60 * 60,
    },
  });
}

function checkLoginLimit() {
  const key = "admin-login";
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }

  if (current.count >= LOGIN_LIMIT) {
    return false;
  }

  current.count += 1;
  return true;
}

function isAdminConfigured() {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(password && sessionSecret && sessionSecret.length >= 32);
}

async function requireAdmin() {
  const session = await useAdminSession();
  if (!session.data.authenticated) {
    throw new Error("Admin authentication required.");
  }
  return session;
}

export const getAdminStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!isAdminConfigured()) {
      return { configured: false, authenticated: false };
    }

    const session = await useAdminSession();
    return {
      configured: true,
      authenticated: Boolean(session.data.authenticated),
    };
  },
);

export const adminLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data }) => {
    if (!isAdminConfigured()) {
      return { success: false, message: "Admin access is not configured yet." };
    }

    if (!checkLoginLimit()) {
      return {
        success: false,
        message: "Too many login attempts. Please wait 15 minutes and try again.",
      };
    }

    if (data.password !== process.env.ADMIN_PASSWORD) {
      return { success: false, message: "The admin password is incorrect." };
    }

    attempts.clear();
    const session = await useAdminSession();
    await session.update({ authenticated: true });

    return { success: true, message: "Signed in." };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await useAdminSession();
    await session.clear();
    return { success: true };
  },
);

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdmin();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return {
        configured: false,
        bookings: [],
        summary: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      };
    }

    const sql = neon(databaseUrl);

    const bookings = await sql`
      select
        id::text,
        full_name as "fullName",
        email,
        phone,
        service,
        preferred_date::text as "preferredDate",
        preferred_time::text as "preferredTime",
        coalesce(notes, '') as notes,
        status,
        created_at::text as "createdAt"
      from bookings
      order by preferred_date asc, preferred_time asc, created_at desc
      limit 250
    `;

    const [summary] = await sql`
      select
        count(*)::int as total,
        count(*) filter (where status = 'pending')::int as pending,
        count(*) filter (where status = 'confirmed')::int as confirmed,
        count(*) filter (where status = 'completed')::int as completed,
        count(*) filter (where status = 'cancelled')::int as cancelled
      from bookings
    `;

    return {
      configured: true,
      bookings,
      summary,
    };
  },
);

export const updateBookingStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      bookingId: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("The booking database is not configured yet.");
    }

    const sql = neon(databaseUrl);

    const [booking] = await sql`
      update bookings
      set status = ${data.status}
      where id = ${data.bookingId}
      returning id::text as id, status
    `;

    if (!booking) {
      throw new Error("Booking not found.");
    }

    return { success: true, booking };
  });
