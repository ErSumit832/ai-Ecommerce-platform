import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productsApi, reviewsApi, wishlistApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    productsApi.get(id).then(({ data }) => setProduct(data));
    reviewsApi.list(id).then(({ data }) => setReviews(data));
  }, [id]);

  async function loadAiSummary() {
    setSummaryLoading(true);
    try {
      const { data } = await reviewsApi.aiSummary(id);
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!user) return navigate("/login");
    setAdding(true);
    try {
      await addItem(id, qty);
      setNotice("Added to cart.");
      setTimeout(() => setNotice(""), 2500);
    } finally {
      setAdding(false);
    }
  }

  async function handleAddToWishlist() {
    if (!user) return navigate("/login");
    await wishlistApi.add(id);
    setNotice("Saved to wishlist.");
    setTimeout(() => setNotice(""), 2500);
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!user) return navigate("/login");
    setSubmittingReview(true);
    try {
      await reviewsApi.create(id, reviewForm);
      const { data } = await reviewsApi.list(id);
      setReviews(data);
      const p = await productsApi.get(id);
      setProduct(p.data);
      setReviewForm({ rating: 5, comment: "" });
    } finally {
      setSubmittingReview(false);
    }
  }

  if (!product) return <p className="mx-auto max-w-7xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading…</p>;

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-line">
          <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-fog">{product.brand}</span>
          <h1 className="mt-1 font-display text-2xl font-700 text-white sm:text-3xl">{product.name}</h1>

          {product.rating_count > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-fog">
              <span className="text-copper">★</span>
              <span>{Number(product.rating_avg).toFixed(1)}</span>
              <span>· {product.rating_count} reviews</span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3 font-mono">
            <span className="text-2xl text-white">${Number(product.price).toFixed(2)}</span>
            {hasDiscount && <span className="text-fog line-through">${Number(product.compare_at_price).toFixed(2)}</span>}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-fog">{product.description}</p>

          <p className="mt-4 font-mono text-xs text-fog">
            {product.stock_quantity > 0 ? (
              <span className="text-signal">● {product.stock_quantity} in stock</span>
            ) : (
              <span className="text-copper">● out of stock</span>
            )}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={product.stock_quantity || 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-md border border-line bg-slate px-2 py-2 text-center text-sm text-white"
            />
            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock_quantity <= 0}
              className="flex-1 rounded-md bg-copper px-5 py-2.5 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50"
            >
              {product.stock_quantity <= 0 ? "Out of stock" : adding ? "Adding…" : "Add to cart"}
            </button>
            <button onClick={handleAddToWishlist} className="rounded-md border border-line px-4 py-2.5 text-sm text-fog hover:border-copper hover:text-white">
              ♡ Save
            </button>
          </div>
          {notice && <p className="mt-2 font-mono text-xs text-signal">{notice}</p>}
        </div>
      </div>

      {/* AI Review Summary */}
      <div className="mt-14 rounded-lg border border-line bg-slate p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wide text-signal">AI review summary</h2>
          {!summary && (
            <button onClick={loadAiSummary} disabled={summaryLoading} className="text-xs text-copper hover:text-copper-light">
              {summaryLoading ? "Summarizing…" : "Generate summary"}
            </button>
          )}
        </div>
        {summary && (
          <div className="mt-3">
            <p className="text-sm text-white/90">{summary.summary}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {summary.pros.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-signal">Pros</p>
                  <ul className="mt-1 space-y-1 text-sm text-fog">
                    {summary.pros.map((p, i) => <li key={i}>+ {p}</li>)}
                  </ul>
                </div>
              )}
              {summary.cons.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-copper">Cons</p>
                  <ul className="mt-1 space-y-1 text-sm text-fog">
                    {summary.cons.map((c, i) => <li key={i}>− {c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-600 text-white">Customer reviews</h2>

        {user && (
          <form onSubmit={handleSubmitReview} className="mt-4 rounded-lg border border-line bg-slate p-4">
            <div className="flex items-center gap-3">
              <label className="font-mono text-xs text-fog">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                className="rounded-md border border-line bg-slate-light px-2 py-1 text-sm text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience with this product…"
              rows={3}
              className="mt-3 w-full rounded-md border border-line bg-slate-light px-3 py-2 text-sm text-white placeholder:text-fog"
            />
            <button type="submit" disabled={submittingReview} className="mt-3 rounded-md bg-copper px-4 py-2 text-sm font-medium text-ink hover:bg-copper-light">
              {submittingReview ? "Posting…" : "Post review"}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-4">
          {reviews.length === 0 && <p className="text-sm text-fog">No reviews yet — be the first.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{r.reviewer_name}</span>
                <span className="text-copper">{"★".repeat(r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-fog">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
