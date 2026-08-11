import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categoriesApi, productsApi } from "../api/endpoints";
import ProductCard from "../components/ProductCard";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ items: [], total: 0, page: 1, page_size: 12 });
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const categorySlug = searchParams.get("category_slug") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    productsApi
      .list({
        search: search || undefined,
        category_slug: categorySlug || undefined,
        sort,
        page,
        page_size: 12,
      })
      .then(({ data }) => setResult(data))
      .finally(() => setLoading(false));
  }, [search, categorySlug, sort, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.page_size));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Filters */}
        <aside className="w-full shrink-0 sm:w-56">
          <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Category</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <button
                onClick={() => updateParam("category_slug", "")}
                className={`text-sm ${!categorySlug ? "text-copper" : "text-fog hover:text-white"}`}
              >
                All products
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => updateParam("category_slug", c.slug)}
                  className={`text-sm ${categorySlug === c.slug ? "text-copper" : "text-fog hover:text-white"}`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl font-600 text-white">
              {search ? `Results for "${search}"` : "All products"}
              <span className="ml-2 font-mono text-sm font-400 text-fog">({result.total})</span>
            </h1>
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="rounded-md border border-line bg-slate px-3 py-1.5 text-sm text-white"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {loading ? (
            <p className="mt-8 font-mono text-sm text-fog">loading…</p>
          ) : result.items.length === 0 ? (
            <p className="mt-8 text-fog">No products match those filters yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3 font-mono text-sm">
              <button
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
                className="rounded border border-line px-3 py-1.5 text-fog disabled:opacity-30"
              >
                ← prev
              </button>
              <span className="text-fog">
                page {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => updateParam("page", String(page + 1))}
                className="rounded border border-line px-3 py-1.5 text-fog disabled:opacity-30"
              >
                next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
