import { createFileRoute } from "@tanstack/react-router";
import { getCloudinaryConfig } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  loader: async () => {
    const cloudinary = await getCloudinaryConfig().catch(() => ({
      configured: false,
      cloudName: null,
      uploadPreset: null,
    }));
    return { cloudinary };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { cloudinary } = Route.useLoaderData();
  const c = cloudinary as {
    configured?: boolean;
    cloudName?: string | null;
    uploadPreset?: string | null;
  };

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">CONFIGURATION</p>
          <h2>Settings</h2>
          <p className="jl-muted">Environment and integrations for the store portal.</p>
        </div>
      </div>

      <section className="jl-card">
        <div className="jl-card-head">
          <h3>Business profile</h3>
        </div>
        <dl className="jl-dl">
          <div>
            <dt>Brand</dt>
            <dd>BV Stitches</dd>
          </div>
          <div>
            <dt>Portal</dt>
            <dd>/admin (Jessy-style store portal)</dd>
          </div>
        </dl>
      </section>

      <section className="jl-card">
        <div className="jl-card-head">
          <h3>Cloudinary</h3>
        </div>
        <dl className="jl-dl">
          <div>
            <dt>Status</dt>
            <dd>{c.configured ? "Connected" : "Not configured"}</dd>
          </div>
          <div>
            <dt>Cloud name</dt>
            <dd>{c.cloudName || "—"}</dd>
          </div>
          <div>
            <dt>Upload preset</dt>
            <dd>{c.uploadPreset || "—"}</dd>
          </div>
        </dl>
        <p className="jl-muted" style={{ marginTop: 12 }}>
          Set <code>VITE_CLOUDINARY_CLOUD_NAME</code> and{" "}
          <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> (unsigned preset with image + video).
        </p>
      </section>

      <section className="jl-card">
        <div className="jl-card-head">
          <h3>Environment checklist</h3>
        </div>
        <ul className="jl-checklist">
          <li>
            <code>DATABASE_URL</code> — Neon Postgres
          </li>
          <li>
            <code>ADMIN_PASSWORD</code> — portal login
          </li>
          <li>
            <code>ADMIN_SESSION_SECRET</code> — 32+ chars
          </li>
          <li>
            <code>VITE_CLOUDINARY_CLOUD_NAME</code> / <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
