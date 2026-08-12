import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../api/endpoints";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const { data } = await ordersApi.checkout({ shipping_address: address });
      await refresh();
      navigate(`/orders/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  if (cart.items.length === 0) {
    return <p className="mx-auto max-w-2xl px-4 py-16 text-fog sm:px-6">Your cart is empty — add something before checking out.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="mt-6 space-y-5">
        <div>
          <label className="font-mono text-xs uppercase tracking-wide text-fog">Shipping address</label>
          <textarea
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, city, state, ZIP"
            className="mt-2 w-full rounded-md border border-line bg-slate px-4 py-3 text-sm text-white placeholder:text-fog focus:border-copper"
          />
        </div>

        <div className="rounded-lg border border-line bg-slate p-5">
          <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Order total</h2>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-fog">{cart.item_count} items</span>
            <span className="font-mono text-lg text-white">${cart.subtotal.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-xs text-fog">Payment is simulated for this demo — no card required.</p>
        </div>

        {error && <p className="text-sm text-copper">{error}</p>}

        <button type="submit" disabled={placing} className="w-full rounded-md bg-copper px-5 py-3 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50">
          {placing ? "Placing order…" : "Place order"}
        </button>
      </form>
    </div>
  );
}
