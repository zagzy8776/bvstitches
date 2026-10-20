import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

type AdminSession = {
  authenticated?: boolean;
};

const COOKIE_NAME = "bv-admin-session";
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SESSION_MAX_AGE_SEC = 8 * 60 * 60;
const attempts = new Map<string, { count: number; resetAt: number }>();

function sessionSecret() {
  const password = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("Admin session is not configured. Add a strong ADMIN_SESSION_SECRET.");
  }
  return password;
}

function seal(payload: AdminSession): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unseal(token: string | undefined): AdminSession {
  if (!token) return {};
  const [body, sig] = token.split(".");
  if (!body || !sig) return {};
  const expected = createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return {};
  } catch {
    return {};
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSession;
  } catch {
    return {};
  }
}

function readSession(): AdminSession {
  return unseal(getCookie(COOKIE_NAME));
}

function writeSession(data: AdminSession) {
  setCookie(COOKIE_NAME, seal(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

function clearSession() {
  deleteCookie(COOKIE_NAME, {
    path: "/",
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
  const sessionSecretValue = process.env.ADMIN_SESSION_SECRET;
  return Boolean(password && sessionSecretValue && sessionSecretValue.length >= 32);
}

async function requireAdmin() {
  const session = readSession();
  if (!session.authenticated) {
    throw new Error("Admin authentication required.");
  }
  return session;
}

export const getAdminStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!isAdminConfigured()) {
      return { configured: false, authenticated: false };
    }

    const session = readSession();
    return {
      configured: true,
      authenticated: Boolean(session.authenticated),
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
    writeSession({ authenticated: true });

    return { success: true, message: "Signed in." };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    clearSession();
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const ProductInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().nullable(),
  category: z.string().trim().min(2).max(80).default("Ready-to-wear"),
  priceNaira: z.number().int().min(0).max(500_000_000).optional().nullable(),
  salePriceNaira: z.number().int().min(0).max(500_000_000).optional().nullable(),
  badge: z.string().trim().max(40).optional().nullable(),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.string().url()).max(12).default([]),
  videos: z.array(z.string().url()).max(6).default([]),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { configured: false, products: [] as const };
  }

  const sql = neon(databaseUrl);

  const products = await sql`
    select
      id::text as id,
      name,
      slug,
      description,
      category,
      price_naira as "priceNaira",
      sale_price_naira as "salePriceNaira",
      badge,
      stock,
      featured,
      is_active as "isActive",
      images,
      videos,
      sort_order as "sortOrder",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from products
    order by sort_order asc, created_at desc
  `;

  return { configured: true, products };
});

export const createProduct = createServerFn({ method: "POST" })
  .validator(ProductInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Database is not configured.");
    }

    const sql = neon(databaseUrl);
    let slug = slugify(data.name);
    if (!slug) slug = `piece-${Date.now()}`;

    const [existing] = await sql`select id from products where slug = ${slug} limit 1`;
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const [row] = await sql`
      insert into products (
        name, slug, description, category,
        price_naira, sale_price_naira, badge, stock,
        featured, is_active, images, videos, sort_order
      )
      values (
        ${data.name},
        ${slug},
        ${data.description ?? null},
        ${data.category},
        ${data.priceNaira ?? null},
        ${data.salePriceNaira ?? null},
        ${data.badge ?? null},
        ${data.stock},
        ${data.featured},
        ${data.isActive},
        ${data.images},
        ${data.videos},
        ${data.sortOrder}
      )
      returning id::text as id, name, slug
    `;

    return { success: true, product: row };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator(ProductInputSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Database is not configured.");
    }

    const sql = neon(databaseUrl);

    const [row] = await sql`
      update products set
        name = ${data.name},
        description = ${data.description ?? null},
        category = ${data.category},
        price_naira = ${data.priceNaira ?? null},
        sale_price_naira = ${data.salePriceNaira ?? null},
        badge = ${data.badge ?? null},
        stock = ${data.stock},
        featured = ${data.featured},
        is_active = ${data.isActive},
        images = ${data.images},
        videos = ${data.videos},
        sort_order = ${data.sortOrder},
        updated_at = now()
      where id = ${data.id}
      returning id::text as id, name
    `;

    if (!row) {
      throw new Error("Product not found.");
    }

    return { success: true, product: row };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    await requireAdmin();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Database is not configured.");
    }

    const sql = neon(databaseUrl);
    const [row] = await sql`
      delete from products where id = ${data.id}
      returning id::text as id
    `;

    if (!row) {
      throw new Error("Product not found.");
    }

    return { success: true };
  });

export const getCloudinaryConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAdmin();

    const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset =
      process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

    return {
      configured: Boolean(cloudName && uploadPreset),
      cloudName: cloudName || null,
      uploadPreset: uploadPreset || null,
    };
  },
);
