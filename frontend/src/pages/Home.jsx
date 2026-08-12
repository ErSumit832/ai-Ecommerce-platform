import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi, productsApi, aiApi } from "../api/endpoints";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([categoriesApi.list(), productsApi.list({ page_size: 8, sort: "rating" })])
      .then(([cats, prods]) => {
        setCategories(cats.data);
        setFeatured(prods.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAskAI(e) {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data } = await aiApi.recommend({ query: aiQuery.trim() });
      setAiResult(data);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      {/* Hero — the thesis: describe what you need, get matched to real gear */}
      <section className="relative overflow-hidden border-b border-line bg-circuit-fade">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-copper">Gear · Provisioned by AI</span>
            <h1 className="mt-4 font-display text-4xl font-700 leading-tight text-white sm:text-5xl">
              Tell it what you're building.<br />It'll spec the hardware.
            </h1>
            <p className="mt-4 max-w-md text-fog">
              Laptops, monitors, and homelab gear for engineers — matched to your actual
              workload by an AI that reads the spec sheet so you don't have to.
            </p>

            <form onSubmit={handleAskAI} className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. I need a laptop for DevOps"
                className="flex-1 rounded-md border border-line bg-slate px-4 py-3 text-sm text-white placeholder:text-fog focus:border-copper"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="rounded-md bg-copper px-5 py-3 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50"
              >
                {aiLoading ? "Matching…" : "Get matched"}
              </button>
            </form>

            {aiResult && (
              <div className="mt-6 max-w-md rounded-lg border border-line bg-slate p-4">
                <p className="font-mono text-xs uppercase tracking-wide text-signal">assistant says</p>
                <p className="mt-1 text-sm text-white/90">{aiResult.explanation}</p>
                {aiResult.products.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {aiResult.products.slice(0, 3).map((p) => (
                      <Link key={p.id} to={`/products/${p.id}`} className="w-28 shrink-0">
                        <img src={p.image_url} alt={p.name} className="aspect-square w-full rounded object-cover" />
                        <p className="mt-1 truncate text-xs text-fog">{p.name}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000"
                alt="Engineer working across multiple monitors with terminal windows open"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-lg border border-line bg-slate px-4 py-3 font-mono text-xs text-fog shadow-card">
              <span className="text-signal">●</span> 1,204 engineers matched this week
            </div>
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-xl font-600 text-white">Shop by category</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?category_slug=${c.slug}`}
              className="rounded-md border border-line bg-slate px-4 py-4 text-center text-sm text-fog transition hover:border-copper/60 hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="trace-divider" />
      </div>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-600 text-white">Top rated this month</h2>
          <Link to="/products" className="text-sm text-copper hover:text-copper-light">
            View all →
          </Link>
        </div>
        {loading ? (
          <p className="mt-6 font-mono text-sm text-fog">loading catalog…</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
