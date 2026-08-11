import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-slate transition hover:border-copper/60 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-light">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded bg-copper px-2 py-0.5 font-mono text-[11px] font-medium text-ink">
            SALE
          </span>
        )}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded bg-ink/80 px-2 py-0.5 font-mono text-[11px] text-fog">
            OUT OF STOCK
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-mono text-[11px] uppercase tracking-wide text-fog">{product.brand}</span>
        <h3 className="line-clamp-2 text-sm font-medium text-white">{product.name}</h3>
        {product.rating_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-fog">
            <span className="text-copper">★</span>
            <span>{Number(product.rating_avg).toFixed(1)}</span>
            <span>({product.rating_count})</span>
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2 font-mono">
          <span className="text-base font-medium text-white">${Number(product.price).toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-fog line-through">${Number(product.compare_at_price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
