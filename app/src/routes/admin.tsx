import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  LogOut,
  RefreshCw,
  Search,
  Scissors,
  UserRound,
} from "lucide-react";
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminStatus,
  updateBookingStatus,
} from "@/lib/admin.functions";

type Status = "pending" | "confirmed" | "completed" | "cancelled";
type Filter = "all" | Status;

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const auth = await getAdminStatus();
    if (!auth.authenticated) {
      return {
        auth,
        dashboard: null,
      };
    }

    return {
      auth,
      dashboard: await getAdminDashboard(),
    };
  },
  headers: () => ({
    "Cache-Control": "private, no-store",
  }),
  component: AdminPage,
});

function AdminPage() {
  const router = useRouter();
  const { auth, dashboard } = Route.useLoaderData();
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  if (!auth.configured) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <div className="admin-login-panel">
            <div className="admin-mark"><Scissors size={18} strokeWidth={1.6} /></div>
            <p className="admin-kicker">BV STITCHES / PRIVATE STUDIO</p>
            <h1>Admin access<br /><em>is almost ready.</em></h1>
            <p className="admin-subtitle">
              Add <code>ADMIN_PASSWORD</code> and a 32+ character <code>ADMIN_SESSION_SECRET</code>
              to your Vercel environment variables, then redeploy.
            </p>
            <a className="admin-back-link" href="/">Return to the atelier <ArrowUpRight size={15} /></a>
          </div>
        </div>
      </main>
    );
  }

  if (!auth.authenticated) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <div className="admin-login-panel">
            <div className="admin-mark"><Scissors size={18} strokeWidth={1.6} /></div>
            <p className="admin-kicker">BV STITCHES / PRIVATE STUDIO</p>
            <h1>Welcome<br /><em>behind the curtain.</em></h1>
            <p className="admin-subtitle">
              Sign in to manage fitting requests, confirm appointments and keep the atelier calendar precise.
            </p>
            <form
              className="admin-login-form"
              onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setLoginBusy(true);
                setLoginMessage("");
                const result = await adminLogin({ data: { password } });
                setLoginBusy(false);
                if (!result.success) {
                  setLoginMessage(result.message);
                  return;
                }
                setPassword("");
                await router.invalidate();
              }}
            >
              <label>
                <span>Studio password</span>
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your private password"
                  required
                />
              </label>
              <button className="admin-primary" disabled={loginBusy} type="submit">
                {loginBusy ? "Opening studio..." : "Enter private studio"}
                <ArrowUpRight size={16} />
              </button>
              {loginMessage ? <p className="admin-message admin-message-error">{loginMessage}</p> : null}
            </form>
            <a className="admin-back-link" href="/">Return to the atelier <ArrowUpRight size={15} /></a>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { bookings, summary, configured } = dashboard;
  const normalizedSearch = search.trim().toLowerCase();

  const visibleBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((booking) => {
      const matchesFilter = filter === "all" || booking.status === filter;
      const haystack = [
        booking.fullName,
        booking.email,
        booking.phone,
        booking.service,
        booking.preferredDate,
        booking.preferredTime,
      ].join(" ").toLowerCase();
      return matchesFilter && (!normalizedSearch || haystack.includes(normalizedSearch));
    });
  }, [bookings, filter, normalizedSearch]);

  const handleStatus = async (bookingId: string, status: Status) => {
    setBusyId(bookingId);
    setActionMessage("");
    try {
      await updateBookingStatus({ data: { bookingId, status } });
      await router.invalidate();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update the booking.");
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    await router.invalidate();
  };

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a href="/" className="admin-brand">
          <span>BV</span>
          <div><strong>STITCHES</strong><small>PRIVATE STUDIO</small></div>
        </a>
        <div className="admin-topbar-actions">
          <a href="/" className="admin-icon-link" aria-label="Open public site" title="Open public site">
            <ArrowUpRight size={16} />
          </a>
          <button className="admin-icon-link" type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <section className="admin-hero">
        <div>
          <p className="admin-kicker">PRIVATE STUDIO / APPOINTMENTS</p>
          <h1>The atelier<br /><em>at a glance.</em></h1>
          <p className="admin-subtitle">
            A quiet control room for the people and pieces moving through BV Stitches.
          </p>
        </div>
        <div className="admin-date-card">
          <span>Today</span>
          <strong>Studio desk</strong>
          <small>Live booking ledger</small>
        </div>
      </section>

      <section className="admin-stats" aria-label="Booking summary">
        <Stat label="Total" value={summary.total} />
        <Stat label="Pending" value={summary.pending} tone="pending" />
        <Stat label="Confirmed" value={summary.confirmed} tone="confirmed" />
        <Stat label="Completed" value={summary.completed} tone="completed" />
      </section>

      <section className="admin-workspace">
        <div className="admin-workspace-head">
          <div>
            <p className="admin-kicker">THE LEDGER</p>
            <h2>Appointments</h2>
          </div>
          <div className="admin-toolbar">
            <label className="admin-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search client, service..."
                aria-label="Search bookings"
              />
            </label>
            <button className="admin-refresh" type="button" onClick={() => void router.invalidate()} title="Refresh bookings">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="admin-filter-row" role="tablist" aria-label="Booking status filters">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as Filter[]).map((item) => (
            <button
              className={filter === item ? "admin-filter active" : "admin-filter"}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
              <span>{item === "all" ? summary.total : summary[item]}</span>
            </button>
          ))}
        </div>

        {!configured ? (
          <div className="admin-empty admin-empty-warning">
            <Scissors size={20} />
            <div>
              <strong>Booking database is not connected.</strong>
              <p>Add your Neon <code>DATABASE_URL</code> to the deployment environment, then refresh.</p>
            </div>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="admin-empty">
            <CalendarDays size={22} />
            <div>
              <strong>No appointments in this view.</strong>
              <p>New fitting requests will appear here as soon as they are submitted.</p>
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <div className="admin-table" role="table" aria-label="Booking ledger">
              {visibleBookings.map((booking) => (
                <article className="admin-row" key={booking.id} role="row">
                  <div className="admin-client" role="cell">
                    <div className="admin-avatar">{booking.fullName.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong>{booking.fullName}</strong>
                      <span>{booking.email}</span>
                    </div>
                  </div>

                  <div className="admin-detail" role="cell">
                    <span className="admin-detail-label"><Scissors size={13} /> Service</span>
                    <strong>{booking.service}</strong>
                  </div>

                  <div className="admin-detail" role="cell">
                    <span className="admin-detail-label"><CalendarDays size={13} /> Date</span>
                    <strong>{booking.preferredDate}</strong>
                  </div>

                  <div className="admin-detail" role="cell">
                    <span className="admin-detail-label"><Clock3 size={13} /> Time</span>
                    <strong>{booking.preferredTime.slice(0, 5)}</strong>
                  </div>

                  <div className="admin-status-wrap" role="cell">
                    <label className="sr-only" htmlFor={booking.id}>Booking status</label>
                    <select
                      id={booking.id}
                      className={`admin-status admin-status-${booking.status}`}
                      value={booking.status}
                      disabled={busyId === booking.id}
                      onChange={(event) => void handleStatus(booking.id, event.target.value as Status)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <details className="admin-note">
                    <summary><UserRound size={14} /> Details</summary>
                    <div>
                      <p><strong>Phone:</strong> {booking.phone}</p>
                      {booking.notes ? <p><strong>Notes:</strong> {booking.notes}</p> : <p>No extra notes.</p>}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </div>
        )}

        {actionMessage ? <p className="admin-message admin-message-error">{actionMessage}</p> : null}
      </section>

      <footer className="admin-footer">
        <span>BV STITCHES / PRIVATE STUDIO</span>
        <span>Appointments are private and server-authorized.</span>
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: Status;
}) {
  return (
    <div className={tone ? `admin-stat admin-stat-${tone}` : "admin-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{tone === "pending" ? "Awaiting reply" : tone === "confirmed" ? "Scheduled" : tone === "completed" ? "Finished" : "All requests"}</small>
    </div>
  );
}
