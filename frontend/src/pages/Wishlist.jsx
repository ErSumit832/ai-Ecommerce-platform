import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { wishlistApi } from "../api/endpoints";
import { useCart } from "../context/CartContext";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    wishlistApi.list().then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, []);

  async function handleRemove(itemId) {
    await wishlistApi.remove(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (loading) return <p className="mx-auto max-w-5xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading wishlist…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Wishlist</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-fog">
          Nothing saved yet.{" "}
          <Link to="/products" className="text-copper hover:text-copper-light">
            Browse products →
          </Link>
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-line bg-slate p-3">
              <Link to={`/products/${item.product.id}`}>
                <img src={item.product.image_url} alt={item.product.name} className="aspect-square w-full rounded object-cover" />
                <p className="mt-2 line-clamp-2 text-sm text-white">{item.product.name}</p>
                <p className="mt-1 font-mono text-sm text-copper">${Number(item.product.price).toFixed(2)}</p>
              </Link>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => addItem(item.product.id, 1)}
                  className="flex-1 rounded-md bg-copper px-2 py-1.5 font-mono text-xs font-medium text-ink hover:bg-copper-light"
                >
                  Add to cart
                </button>
                <button onClick={() => handleRemove(item.id)} className="rounded-md border border-line px-2 py-1.5 font-mono text-xs text-fog hover:text-white">
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
