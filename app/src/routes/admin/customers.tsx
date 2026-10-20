import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { getAdminDashboard } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/customers")({
  loader: async () => ({ dashboard: await getAdminDashboard() }),
  component: CustomersPage,
});

function CustomersPage() {
  const { dashboard } = Route.useLoaderData();
  const bookings = (dashboard.bookings ?? []) as Array<{
    fullName: string;
    email: string;
    phone: string;
    preferredDate: string;
    status: string;
  }>;
  const [search, setSearch] = useState("");

  const customers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; email: string; phone: string; bookings: number; lastDate: string }
    >();
    for (const b of bookings) {
      const key = b.email.toLowerCase();
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          name: b.fullName,
          email: b.email,
          phone: b.phone,
          bookings: 1,
          lastDate: b.preferredDate,
        });
      } else {
        prev.bookings += 1;
        if (b.preferredDate > prev.lastDate) prev.lastDate = b.preferredDate;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.bookings - a.bookings);
  }, [bookings]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [c.name, c.email, c.phone].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">CRM</p>
          <h2>Customers</h2>
          <p className="jl-muted">Unique clients from booking history.</p>
        </div>
      </div>

      <div className="jl-kpi-grid jl-kpi-grid-3">
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Customers</span>
            <Users size={16} />
          </div>
          <strong>{customers.length}</strong>
          <small>Unique emails</small>
        </div>
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Bookings</span>
          </div>
          <strong>{bookings.length}</strong>
          <small>Total requests</small>
        </div>
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Repeat</span>
          </div>
          <strong>{customers.filter((c) => c.bookings > 1).length}</strong>
          <small>More than one booking</small>
        </div>
      </div>

      <label className="jl-search">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers…"
        />
      </label>

      <div className="jl-card">
        {filtered.length === 0 ? (
          <p className="jl-empty">No customers yet.</p>
        ) : (
          <table className="jl-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Bookings</th>
                <th>Last date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.email}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.bookings}</td>
                  <td>{c.lastDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
