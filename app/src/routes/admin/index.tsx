import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Banknote,
  CalendarDays,
  Package,
  Plus,
  ShoppingBag,
  Users,
} from "lucide-react";
import { getAdminDashboard, listProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const [dashboard, products] = await Promise.all([
      getAdminDashboard(),
      listProducts().catch(() => ({ configured: false, products: [] })),
    ]);
    return { dashboard, products };
  },
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { dashboard, products } = Route.useLoaderData();
  const summary = dashboard.summary ?? {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  const productList = (products as { products?: unknown[] }).products ?? [];
  const bookings = (dashboard.bookings ?? []) as Array<{
    id: string;
    fullName: string;
    service: string;
    preferredDate: string;
    preferredTime: string;
    status: string;
  }>;

  const kpis = [
    {
      label: "Bookings",
      value: String(summary.total),
      sub: `${summary.pending} pending`,
      icon: ShoppingBag,
    },
    {
      label: "Confirmed",
      value: String(summary.confirmed),
      sub: "Scheduled fittings",
      icon: CalendarDays,
    },
    {
      label: "Products",
      value: String(productList.length),
      sub: "Catalogue pieces",
      icon: Package,
    },
    {
      label: "Completed",
      value: String(summary.completed),
      sub: "Finished appointments",
      icon: Banknote,
    },
  ];

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">OVERVIEW</p>
          <h2>Dashboard</h2>
          <p className="jl-muted">Atelier activity at a glance — bookings, catalogue, customers.</p>
        </div>
        <div className="jl-actions">
          <Link to="/admin/products" className="jl-btn jl-btn-secondary">
            <Package size={16} /> Products
          </Link>
          <Link to="/admin/bookings" className="jl-btn jl-btn-primary">
            <Plus size={16} /> Review bookings
          </Link>
        </div>
      </div>

      <div className="jl-kpi-grid">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="jl-card jl-kpi">
              <div className="jl-kpi-top">
                <span>{k.label}</span>
                <span className="jl-kpi-icon">
                  <Icon size={16} />
                </span>
              </div>
              <strong>{k.value}</strong>
              <small>{k.sub}</small>
            </div>
          );
        })}
      </div>

      <div className="jl-grid-2">
        <section className="jl-card">
          <div className="jl-card-head">
            <h3>Recent bookings</h3>
            <Link to="/admin/bookings">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="jl-empty">No bookings yet.</p>
          ) : (
            <ul className="jl-list">
              {bookings.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <div>
                    <strong>{b.fullName}</strong>
                    <span>
                      {b.service} · {b.preferredDate} {String(b.preferredTime).slice(0, 5)}
                    </span>
                  </div>
                  <em className={`jl-pill jl-pill-${b.status}`}>{b.status}</em>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="jl-card">
          <div className="jl-card-head">
            <h3>Quick actions</h3>
          </div>
          <div className="jl-quick">
            <Link to="/admin/products" className="jl-quick-item">
              <Package size={18} />
              <div>
                <strong>Manage products</strong>
                <span>Upload photos & videos via Cloudinary</span>
              </div>
            </Link>
            <Link to="/admin/customers" className="jl-quick-item">
              <Users size={18} />
              <div>
                <strong>Customers</strong>
                <span>People who booked the atelier</span>
              </div>
            </Link>
            <Link to="/admin/settings" className="jl-quick-item">
              <Banknote size={18} />
              <div>
                <strong>Settings</strong>
                <span>Cloudinary, env, studio profile</span>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
