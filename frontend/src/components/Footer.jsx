import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 font-display text-lg font-700 text-white">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-copper" />
              Circuitry
            </div>
            <p className="mt-3 text-sm text-fog">Gear for people who run production.</p>
          </div>
          <FooterCol title="Shop" links={[["All products", "/products"], ["Laptops", "/products?category_slug=laptops"], ["Monitors", "/products?category_slug=monitors"]]} />
          <FooterCol title="Account" links={[["Orders", "/orders"], ["Wishlist", "/wishlist"], ["Sign in", "/login"]]} />
          <FooterCol title="Company" links={[["About", "/"], ["AI features", "/"], ["Support", "/"]]} />
        </div>
        <div className="trace-divider my-8" />
        <p className="text-center font-mono text-xs text-fog">© {new Date().getFullYear()} Circuitry. Built as a portfolio project.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-mono text-xs uppercase tracking-wider text-fog">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="text-sm text-fog hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
