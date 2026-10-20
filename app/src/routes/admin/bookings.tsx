import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CalendarDays, Hash, RefreshCw, Search, UserRound } from "lucide-react";
import { getAdminDashboard, updateBookingStatus } from "@/lib/admin.functions";

type Status = "pending" | "confirmed" | "completed" | "cancelled";
type Filter = "all" | Status;

type Booking = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: Status;
};

function refId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export const Route = createFileRoute("/admin/bookings")({
  loader: async () => ({ dashboard: await getAdminDashboard() }),
  component: BookingsPage,
});

function BookingsPage() {
  const router = useRouter();
  const { dashboard } = Route.useLoaderData();
  const bookings = (dashboard.bookings ?? []) as Booking[];
  const summary = dashboard.summary ?? {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const visible = bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [b.fullName, b.email, b.phone, b.service, refId(b.id)]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const setStatus = async (bookingId: string, status: Status) => {
    setBusyId(bookingId);
    setMsg("");
    try {
      await updateBookingStatus({ data: { bookingId, status } });
      await router.invalidate();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">ORDERS · APPOINTMENTS</p>
          <h2>Bookings</h2>
          <p className="jl-muted">Fitting requests and atelier appointments (Jessy Orders equivalent).</p>
        </div>
        <button
          type="button"
          className="jl-btn jl-btn-secondary"
          onClick={() => void router.invalidate()}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="jl-toolbar">
        <label className="jl-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, service, ref…"
          />
        </label>
        <div className="jl-filters">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "jl-chip active" : "jl-chip"}
              onClick={() => setFilter(f)}
            >
              {f}
              <span>
                {f === "all" ? summary.total : summary[f as keyof typeof summary]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {msg ? <div className="jl-banner warn">{msg}</div> : null}

      {visible.length === 0 ? (
        <div className="jl-card jl-empty-state">
          <CalendarDays size={28} />
          <strong>No bookings in this view</strong>
          <p>New requests from the public form appear here.</p>
        </div>
      ) : (
        <div className="jl-table-wrap">
          {visible.map((b) => (
            <article key={b.id} className="jl-order-row">
              <div className="jl-order-main">
                <div className="jl-order-meta">
                  <span className={`jl-pill jl-pill-${b.status}`}>{b.status}</span>
                  <span className="jl-ref">
                    <Hash size={12} /> {refId(b.id)}
                  </span>
                </div>
                <h3>
                  <UserRound size={16} /> {b.fullName}
                </h3>
                <p>{b.service}</p>
                <p className="jl-muted">
                  {b.preferredDate} · {String(b.preferredTime).slice(0, 5)} · {b.email} · {b.phone}
                </p>
                {b.notes ? <p className="jl-notes">{b.notes}</p> : null}
              </div>
              <div className="jl-order-actions">
                {(["pending", "confirmed", "completed", "cancelled"] as Status[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={b.status === s ? "jl-chip active" : "jl-chip"}
                    disabled={busyId === b.id || b.status === s}
                    onClick={() => void setStatus(b.id, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
