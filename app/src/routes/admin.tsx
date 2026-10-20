import { useState, type FormEvent } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sun,
  Users,
  X,
  Scissors,
} from "lucide-react";
import { adminLogin, adminLogout, getAdminStatus } from "@/lib/admin.functions";

const NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Products", to: "/admin/products", icon: Package },
  { label: "Bookings", to: "/admin/bookings", icon: ShoppingBag },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
] as const;

export const Route = createFileRoute("/admin")({
  loader: async () => {
    const auth = await getAdminStatus();
    return { auth };
  },
  headers: () => ({
    "Cache-Control": "private, no-store",
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const { auth } = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-admin-theme", next);
    }
  };

  if (!auth.configured) {
    return (
      <main className="jl-admin-login">
        <div className="jl-admin-login-card">
          <div className="jl-admin-mark">
            <Scissors size={18} />
          </div>
          <p className="jl-kicker">BV STITCHES · STORE PORTAL</p>
          <h1>Admin is almost ready</h1>
          <p>
            Set <code>ADMIN_PASSWORD</code> and a 32+ character{" "}
            <code>ADMIN_SESSION_SECRET</code> in Vercel, then redeploy.
          </p>
          <a href="/">← Back to site</a>
        </div>
      </main>
    );
  }

  if (!auth.authenticated) {
    return (
      <main className="jl-admin-login">
        <div className="jl-admin-login-card">
          <div className="jl-admin-mark">
            <Scissors size={18} />
          </div>
          <p className="jl-kicker">BV STITCHES · STORE PORTAL</p>
          <h1>Sign in</h1>
          <p>Private studio control room — same portal pattern as Jessy Luxury admin.</p>
          <form
            className="jl-login-form"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              setLoginBusy(true);
              setLoginMessage("");
              try {
                const result = await adminLogin({ data: { password } });
                if (!result.success) {
                  setLoginMessage(result.message || "Login failed");
                  return;
                }
                setPassword("");
                await router.invalidate();
              } catch (err) {
                setLoginMessage(err instanceof Error ? err.message : "Could not sign in");
              } finally {
                setLoginBusy(false);
              }
            }}
          >
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginBusy}
              />
            </label>
            {loginMessage ? <p className="jl-error">{loginMessage}</p> : null}
            <button type="submit" disabled={loginBusy}>
              {loginBusy ? "Signing in…" : "Enter portal"}
            </button>
          </form>
          <a href="/">← Back to site</a>
        </div>
      </main>
    );
  }

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to || pathname === `${to}/`;
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  return (
    <div className="jl-admin" data-admin-theme={theme}>
      {sidebarOpen ? (
        <button
          type="button"
          className="jl-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={sidebarOpen ? "jl-sidebar open" : "jl-sidebar"}>
        <div className="jl-sidebar-brand">
          <Link to="/admin" onClick={() => setSidebarOpen(false)}>
            <span className="jl-logo">BV</span>
            <div>
              <strong>BV Stitches</strong>
              <small>Store portal</small>
            </div>
          </Link>
          <button
            type="button"
            className="jl-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="jl-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? "jl-nav-item active" : "jl-nav-item"}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="jl-sidebar-foot">
          <button
            type="button"
            className="jl-nav-item"
            onClick={async () => {
              await adminLogout();
              await router.invalidate();
            }}
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="jl-main">
        <header className="jl-topbar">
          <div className="jl-topbar-left">
            <button
              type="button"
              className="jl-icon-btn jl-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <p className="jl-kicker">STORE PORTAL</p>
              <h1 className="jl-page-title">
                {NAV.find((n) => isActive(n.to, "exact" in n ? n.exact : false))?.label ||
                  "Admin"}
              </h1>
            </div>
          </div>
          <div className="jl-topbar-right">
            <button
              type="button"
              className="jl-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="jl-icon-btn jl-bell" aria-hidden>
              <Bell size={18} />
            </span>
          </div>
        </header>

        <div className="jl-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
