import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ImagePlus, Loader2, Package, Pencil, Plus, Search, Trash2, Upload, Film, X } from "lucide-react";
import { createProduct, deleteProduct, getCloudinaryConfig, listProducts, updateProduct } from "@/lib/admin.functions";

type Product = {
  id: string; name: string; category: string; priceNaira: number | null; salePriceNaira: number | null;
  badge: string | null; stock: number; featured: boolean; isActive: boolean; images: string[]; videos: string[];
  description: string | null; sortOrder: number;
};

const CATEGORIES = ["Ready-to-wear", "Bespoke", "Traditional / Native", "Corporate", "Accessories", "Lookbook"];

export const Route = createFileRoute("/admin/products")({
  loader: async () => {
    const [products, cloudinary] = await Promise.all([
      listProducts(),
      getCloudinaryConfig().catch(() => ({ configured: false, cloudName: null, uploadPreset: null })),
    ]);
    return { products, cloudinary };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const router = useRouter();
  const { products: payload, cloudinary } = Route.useLoaderData();
  const list = ((payload as { products?: Product[] }).products ?? []) as Product[];
  const cld = cloudinary as { configured?: boolean; cloudName?: string | null; uploadPreset?: string | null };
  const cloudinaryReady = Boolean(cld.configured && cld.cloudName && cld.uploadPreset);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const empty = {
    name: "", description: "", category: "Ready-to-wear", priceNaira: "", salePriceNaira: "",
    badge: "", stock: "0", featured: false, isActive: true, images: [] as string[], videos: [] as string[], sortOrder: "0",
  };
  const [form, setForm] = useState(empty);
  const filtered = list.filter((p) => !search.trim() || [p.name, p.category, p.badge || ""].join(" ").toLowerCase().includes(search.toLowerCase()));
  const naira = (n: number | null) => (n == null ? "—" : `₦${n.toLocaleString("en-NG")}`);

  async function uploadToCloudinary(file: File, resourceType: "image" | "video") {
    if (!cld.cloudName || !cld.uploadPreset) throw new Error("Cloudinary is not configured.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", cld.uploadPreset);
    fd.append("folder", "bvstitches/products");
    const endpoint = `https://api.cloudinary.com/v1_1/${cld.cloudName}/${resourceType}/upload`;
    return new Promise<{ url: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (!data.secure_url) reject(new Error("No URL returned"));
            else resolve({ url: data.secure_url });
          } catch {
            reject(new Error("Invalid Cloudinary response"));
          }
        } else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(fd);
    });
  }

  const onImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const next = [...form.images];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") || file.size > 12 * 1024 * 1024) continue;
        next.push((await uploadToCloudinary(file, "image")).url);
      }
      setForm((f) => ({ ...f, images: next.slice(0, 12) }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onVideos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const next = [...form.videos];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("video/") || file.size > 100 * 1024 * 1024) continue;
        next.push((await uploadToCloudinary(file, "video")).url);
      }
      setForm((f) => ({ ...f, videos: next.slice(0, 6) }));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Video upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (videoRef.current) videoRef.current.value = "";
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        priceNaira: form.priceNaira ? Number(form.priceNaira) : null,
        salePriceNaira: form.salePriceNaira ? Number(form.salePriceNaira) : null,
        badge: form.badge.trim() || null,
        stock: Number(form.stock) || 0,
        featured: form.featured,
        isActive: form.isActive,
        images: form.images,
        videos: form.videos,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) await updateProduct({ data: { id: editingId, ...data } });
      else await createProduct({ data });
      setShowForm(false);
      setEditingId(null);
      setForm(empty);
      await router.invalidate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product from the catalog?")) return;
    setBusy(true);
    try {
      await deleteProduct({ data: { id } });
      await router.invalidate();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || "",
      category: p.category,
      priceNaira: p.priceNaira != null ? String(p.priceNaira) : "",
      salePriceNaira: p.salePriceNaira != null ? String(p.salePriceNaira) : "",
      badge: p.badge || "",
      stock: String(p.stock),
      featured: p.featured,
      isActive: p.isActive,
      images: [...(p.images || [])],
      videos: [...(p.videos || [])],
      sortOrder: String(p.sortOrder ?? 0),
    });
    setMessage("");
    setShowForm(true);
  };

  return (
    <div className="jl-stack">
      <div className="jl-page-head">
        <div>
          <p className="jl-kicker">CATALOGUE</p>
          <h2>Products</h2>
          <p className="jl-muted">Pieces you sell — Cloudinary photos and videos (Jessy-style admin).</p>
        </div>
        <button type="button" className="jl-btn jl-btn-primary" onClick={() => { setEditingId(null); setForm(empty); setShowForm(true); }}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {!cloudinaryReady ? (
        <div className="jl-banner warn">
          Cloudinary not configured. Set <code>VITE_CLOUDINARY_CLOUD_NAME</code> and <code>VITE_CLOUDINARY_UPLOAD_PRESET</code>.
        </div>
      ) : null}

      <label className="jl-search">
        <Search size={15} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
      </label>

      {filtered.length === 0 ? (
        <div className="jl-card jl-empty-state">
          <Package size={28} />
          <strong>No products yet</strong>
          <p>Add your first piece and upload photos or a short video.</p>
        </div>
      ) : (
        <div className="jl-product-grid">
          {filtered.map((p) => (
            <article key={p.id} className="jl-product-card">
              <div className="jl-product-media">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} loading="lazy" />
                ) : p.videos?.[0] ? (
                  <video src={p.videos[0]} muted playsInline />
                ) : (
                  <div className="jl-product-ph"><ImagePlus size={22} /></div>
                )}
              </div>
              <div className="jl-product-body">
                <span className="jl-kicker">{p.category}</span>
                <h3>{p.name}</h3>
                <p className="jl-price">{naira(p.salePriceNaira ?? p.priceNaira)}</p>
                <p className="jl-meta">Stock {p.stock} · {(p.images || []).length} img · {(p.videos || []).length} vid</p>
                <div className="jl-row-actions">
                  <button type="button" className="jl-btn jl-btn-ghost" onClick={() => openEdit(p)}><Pencil size={14} /> Edit</button>
                  <button type="button" className="jl-btn jl-btn-ghost danger" disabled={busy} onClick={() => void remove(p.id)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="jl-modal-backdrop">
          <div className="jl-modal">
            <div className="jl-modal-head">
              <div>
                <p className="jl-kicker">{editingId ? "EDIT" : "NEW"} PRODUCT</p>
                <h2>{editingId ? "Update product" : "Add product"}</h2>
              </div>
              <button type="button" className="jl-icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form className="jl-form" onSubmit={(e) => void save(e)}>
              <label><span>Name</span><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
              <label><span>Category</span><select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="span-2"><span>Description</span><textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label>
              <label><span>Price (₦)</span><input type="number" min={0} value={form.priceNaira} onChange={(e) => setForm((f) => ({ ...f, priceNaira: e.target.value }))} /></label>
              <label><span>Sale price (₦)</span><input type="number" min={0} value={form.salePriceNaira} onChange={(e) => setForm((f) => ({ ...f, salePriceNaira: e.target.value }))} /></label>
              <label><span>Stock</span><input type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} /></label>
              <label><span>Badge</span><input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} /></label>
              <div className="span-2 jl-upload">
                <div className="jl-upload-head"><strong><ImagePlus size={16} /> Photos</strong></div>
                <div className="jl-thumbs">
                  {form.images.map((url, i) => (
                    <div key={url} className="jl-thumb"><img src={url} alt="" /><button type="button" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}><X size={12} /></button></div>
                  ))}
                  <button type="button" className="jl-upload-btn" disabled={uploading || !cloudinaryReady} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}{uploading ? `${uploadProgress}%` : "Upload"}</button>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void onImages(e)} />
                </div>
              </div>
              <div className="span-2 jl-upload">
                <div className="jl-upload-head"><strong><Film size={16} /> Videos</strong></div>
                <div className="jl-thumbs">
                  {form.videos.map((url, i) => (
                    <div key={url} className="jl-thumb"><video src={url} muted /><button type="button" onClick={() => setForm((f) => ({ ...f, videos: f.videos.filter((_, idx) => idx !== i) }))}><X size={12} /></button></div>
                  ))}
                  <button type="button" className="jl-upload-btn" disabled={uploading || !cloudinaryReady} onClick={() => videoRef.current?.click()}>{uploading ? <Loader2 className="spin" size={16} /> : <Film size={16} />}{uploading ? `${uploadProgress}%` : "Upload video"}</button>
                  <input ref={videoRef} type="file" accept="video/*" multiple hidden onChange={(e) => void onVideos(e)} />
                </div>
              </div>
              <label className="jl-check"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
              <label className="jl-check"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /> Active</label>
              {message ? <p className="jl-error span-2">{message}</p> : null}
              <div className="jl-modal-actions span-2">
                <button type="button" className="jl-btn jl-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="jl-btn jl-btn-primary" disabled={busy || uploading}>{busy ? "Saving…" : editingId ? "Save changes" : "Create product"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
