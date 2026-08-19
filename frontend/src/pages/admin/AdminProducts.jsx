import { useEffect, useState } from "react";
import { categoriesApi, productsApi } from "../../api/endpoints";
import { AdminNav } from "./AdminDashboard";

const EMPTY_FORM = {
  name: "", description: "", price: "", compare_at_price: "", stock_quantity: "",
  image_url: "", brand: "", tags: "", category_id: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const { data } = await productsApi.list({ page_size: 100, sort: "newest" });
    setProducts(data.items);
  }

  useEffect(() => {
    loadProducts();
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description, price: p.price,
      compare_at_price: p.compare_at_price || "", stock_quantity: p.stock_quantity,
      image_url: p.image_url, brand: p.brand, tags: p.tags, category_id: p.category?.id || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock_quantity: Number(form.stock_quantity),
      category_id: form.category_id || null,
    };
    try {
      if (editingId) await productsApi.update(editingId, payload);
      else await productsApi.create(payload);
      resetForm();
      loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Deactivate this product?")) return;
    await productsApi.remove(id);
    loadProducts();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminNav active="products" />

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line bg-slate p-5 lg:col-span-1">
          <h2 className="font-mono text-xs uppercase tracking-wide text-signal">{editingId ? "Edit product" : "New product"}</h2>
          <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
          <Input label="Brand" value={form.brand} onChange={(v) => setForm((f) => ({ ...f, brand: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Price" type="number" step="0.01" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} required />
            <Input label="Compare-at price" type="number" step="0.01" value={form.compare_at_price} onChange={(v) => setForm((f) => ({ ...f, compare_at_price: v }))} />
          </div>
          <Input label="Stock quantity" type="number" value={form.stock_quantity} onChange={(v) => setForm((f) => ({ ...f, stock_quantity: v }))} required />
          <Input label="Image URL" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} />
          <Input label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} />
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wide text-fog">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="mt-1 w-full rounded-md border border-line bg-slate-light px-3 py-2 text-sm text-white"
            >
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wide text-fog">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-md border border-line bg-slate-light px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 rounded-md bg-copper px-4 py-2 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="rounded-md border border-line px-3 py-2 text-sm text-fog hover:text-white">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-2">
          <div className="space-y-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-slate p-3">
                <img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{p.name}</p>
                  <p className="font-mono text-xs text-fog">${Number(p.price).toFixed(2)} · stock {p.stock_quantity}</p>
                </div>
                <button onClick={() => startEdit(p)} className="font-mono text-xs text-signal hover:underline">edit</button>
                <button onClick={() => handleDelete(p.id)} className="font-mono text-xs text-copper hover:underline">deactivate</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", ...rest }) {
  return (
    <div>
      <label className="font-mono text-[11px] uppercase tracking-wide text-fog">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-slate-light px-3 py-2 text-sm text-white"
        {...rest}
      />
    </div>
  );
}
