import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cart } = useCart();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-xl font-700 tracking-tight text-white">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-copper" aria-hidden="true" />
          Circuitry
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 items-center md:flex">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search laptops, monitors, homelab gear…"
            className="w-full rounded-l-md border border-line bg-slate px-4 py-2 text-sm text-white placeholder:text-fog focus:border-copper"
          />
          <button type="submit" className="rounded-r-md border border-l-0 border-line bg-slate-light px-4 py-2 text-sm font-medium text-fog hover:text-white">
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-4 text-sm sm:gap-5">
          <Link to="/products" className="hidden text-fog hover:text-white sm:inline">
            Shop
          </Link>
          {user && (
            <Link to="/wishlist" className="hidden text-fog hover:text-white sm:inline">
              Wishlist
            </Link>
          )}
          {user && (
            <Link to="/orders" className="hidden text-fog hover:text-white sm:inline">
              Orders
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="hidden rounded border border-signal/40 px-2 py-1 font-mono text-xs text-signal sm:inline">
              Admin
            </Link>
          )}

          <Link to="/cart" className="relative flex items-center text-fog hover:text-white" aria-label="Cart">
            <CartIcon />
            {cart.item_count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-copper font-mono text-[10px] font-medium text-ink">
                {cart.item_count}
              </span>
            )}
          </Link>

          {user ? (
            <button onClick={logout} className="rounded-md border border-line px-3 py-1.5 text-fog hover:border-copper hover:text-white">
              Log out
            </button>
          ) : (
            <Link to="/login" className="rounded-md bg-copper px-3 py-1.5 font-medium text-ink hover:bg-copper-light">
              Sign in
            </Link>
          )}
        </nav>
      </div>
      <form onSubmit={handleSearch} className="flex px-4 pb-3 md:hidden">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-md border border-line bg-slate px-4 py-2 text-sm text-white placeholder:text-fog"
        />
      </form>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2l2.2 12.2a2 2 0 0 0 2 1.65h8.3a2 2 0 0 0 1.97-1.66L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
