import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api/endpoints";

const STATUS_COLOR = {
  pending: "text-fog",
  paid: "text-signal",
  processing: "text-signal",
  shipped: "text-copper",
  delivered: "text-signal",
  cancelled: "text-copper",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mx-auto max-w-4xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading orders…</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Your orders</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-fog">
          No orders yet.{" "}
          <Link to="/products" className="text-copper hover:text-copper-light">
            Start shopping →
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="block rounded-lg border border-line bg-slate p-4 hover:border-copper/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-fog">#{o.tracking_number || o.id.slice(0, 8)}</p>
                  <p className="text-sm text-white">{new Date(o.created_at).toLocaleDateString()} · {o.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-xs uppercase ${STATUS_COLOR[o.status] || "text-fog"}`}>{o.status}</p>
                  <p className="font-mono text-sm text-white">${Number(o.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
