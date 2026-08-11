import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ordersApi } from "../api/endpoints";

const STEPS = ["pending", "paid", "processing", "shipped", "delivered"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    ordersApi.get(id).then(({ data }) => setOrder(data));
  }, [id]);

  if (!order) return <p className="mx-auto max-w-3xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading…</p>;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Order #{order.tracking_number || order.id.slice(0, 8)}</h1>
      <p className="mt-1 text-sm text-fog">Placed {new Date(order.created_at).toLocaleString()}</p>

      {order.status !== "cancelled" ? (
        <div className="mt-8 flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-1 flex-col items-center text-center">
              <div className={`h-3 w-3 rounded-full ${i <= stepIndex ? "bg-copper" : "bg-line"}`} />
              <p className={`mt-2 font-mono text-[11px] uppercase ${i <= stepIndex ? "text-white" : "text-fog"}`}>{step}</p>
              {i < STEPS.length - 1 && <div className={`mt-[-22px] h-px w-full translate-y-[-6px] ${i < stepIndex ? "bg-copper" : "bg-line"}`} />}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 font-mono text-sm text-copper">This order was cancelled.</p>
      )}

      <div className="mt-10 rounded-lg border border-line bg-slate p-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Shipping to</h2>
        <p className="mt-1 text-sm text-white">{order.shipping_address}</p>
      </div>

      <div className="mt-6 space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-slate p-4">
            <div>
              <p className="text-sm text-white">{item.product_name}</p>
              <p className="font-mono text-xs text-fog">Qty {item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
            </div>
            <p className="font-mono text-sm text-white">${(item.unit_price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between border-t border-line pt-4">
        <span className="font-mono text-sm text-fog">Total</span>
        <span className="font-mono text-lg text-white">${Number(order.total_amount).toFixed(2)}</span>
      </div>
    </div>
  );
}
