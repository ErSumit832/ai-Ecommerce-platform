import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, updateItem, removeItem, loading } = useCart();

  if (loading) return <p className="mx-auto max-w-4xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading cart…</p>;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-700 text-white">Your cart is empty</h1>
        <p className="mt-2 text-fog">Nothing here yet — go find something worth deploying.</p>
        <Link to="/products" className="mt-6 inline-block rounded-md bg-copper px-5 py-2.5 text-sm font-medium text-ink hover:bg-copper-light">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Your cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-line bg-slate p-4">
              <Link to={`/products/${item.product.id}`} className="shrink-0">
                <img src={item.product.image_url} alt={item.product.name} className="h-20 w-20 rounded object-cover" />
              </Link>
              <div className="flex-1">
                <Link to={`/products/${item.product.id}`} className="text-sm font-medium text-white hover:text-copper">
                  {item.product.name}
                </Link>
                <p className="mt-1 font-mono text-xs text-fog">${Number(item.product.price).toFixed(2)} each</p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock_quantity}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-md border border-line bg-slate-light px-2 py-1 text-center text-sm text-white"
                  />
                  <button onClick={() => removeItem(item.id)} className="font-mono text-xs text-fog hover:text-copper">
                    remove
                  </button>
                </div>
              </div>
              <p className="font-mono text-sm text-white">${item.line_total.toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-lg border border-line bg-slate p-5">
          <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Order summary</h2>
          <div className="mt-3 flex justify-between text-sm text-fog">
            <span>Subtotal ({cart.item_count} items)</span>
            <span className="font-mono text-white">${cart.subtotal.toFixed(2)}</span>
          </div>
          <div className="trace-divider my-4" />
          <Link
            to="/checkout"
            className="block w-full rounded-md bg-copper px-4 py-2.5 text-center text-sm font-medium text-ink hover:bg-copper-light"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
