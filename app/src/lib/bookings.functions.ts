import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

const BookingSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(180),
  phone: z.string().trim().min(7, "Please enter a valid phone number.").max(40),
  service: z.string().trim().min(2, "Please select a service.").max(100),
  preferredDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/, "Choose a valid date."),
  preferredTime: z.string().regex(/^\\d{2}:\\d{2}$/, "Choose a valid time."),
  notes: z.string().trim().max(1000).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .validator(BookingSchema)
  .handler(async ({ data }) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("The booking database is not configured yet.");
    }

    const sql = neon(databaseUrl);

    const [existing] = await sql`
      select id
      from bookings
      where preferred_date = ${data.preferredDate}
        and preferred_time = ${data.preferredTime}
        and status in ('pending', 'confirmed')
      limit 1
    `;

    if (existing) {
      throw new Error("That appointment time has already been requested. Please choose another time.");
    }

    const [booking] = await sql`
      insert into bookings (
        full_name, email, phone, service, preferred_date, preferred_time, notes
      )
      values (
        ${data.fullName},
        ${data.email},
        ${data.phone},
        ${data.service},
        ${data.preferredDate},
        ${data.preferredTime},
        ${data.notes || null}
      )
      returning id, status, preferred_date, preferred_time
    `;

    return {
      success: true,
      bookingId: booking.id as string,
      status: booking.status as string,
    };
  });
