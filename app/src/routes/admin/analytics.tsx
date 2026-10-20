import { createFileRoute } from "@tanstack/react-router";
import { getAdminDashboard, listProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/analytics")({
  loader: async () => {
    const [dashboard, products] = await Promise.all([
      getAdminDashboard(),
      listProducts().catch(() => ({ products: [] })),
    ]);
    return { dashboard, products };
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { dashboard, products } = Route.useLoaderData();
  const summary = dashboard.summary ?? {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  const productList = ((products as { products?: unknown[] }).products ?? []) as Array<{
    stock: number;
    priceNaira: number | null;
    category: string;
  }>;

  const byCategory = productList.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const conversion =
    summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">INSIGHTS</p>
          <h2>Analytics</h2>
          <p className="jl-muted">Booking funnel and catalogue mix.</p>
        </div>
      </div>

      <div className="jl-kpi-grid">
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Completion rate</span>
          </div>
          <strong>{conversion}%</strong>
          <small>
            {summary.completed} of {summary.total} bookings
          </small>
        </div>
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Pending</span>
          </div>
          <strong>{summary.pending}</strong>
          <small>Awaiting confirmation</small>
        </div>
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Confirmed</span>
          </div>
          <strong>{summary.confirmed}</strong>
          <small>On the calendar</small>
        </div>
        <div className="jl-card jl-kpi">
          <div className="jl-kpi-top">
            <span>Cancelled</span>
          </div>
          <strong>{summary.cancelled}</strong>
          <small>Dropped requests</small>
        </div>
      </div>

      <section className="jl-card">
        <div className="jl-card-head">
          <h3>Products by category</h3>
        </div>
        {Object.keys(byCategory).length === 0 ? (
          <p className="jl-empty">Add products to see category mix.</p>
        ) : (
          <ul className="jl-list">
            {Object.entries(byCategory).map(([cat, count]) => (
              <li key={cat}>
                <div>
                  <strong>{cat}</strong>
                  <span>{count} pieces</span>
                </div>
                <em>{count}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
