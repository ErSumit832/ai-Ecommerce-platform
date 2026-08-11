import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, aiApi } from "../../api/endpoints";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [logText, setLogText] = useState("");
  const [incident, setIncident] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    adminApi.dashboard().then(({ data }) => setStats(data));
    aiApi.salesAnalytics().then(({ data }) => setAnalytics(data));
  }, []);

  async function handleAnalyzeLog(e) {
    e.preventDefault();
    if (!logText.trim()) return;
    setAnalyzing(true);
    setIncident(null);
    try {
      const { data } = await aiApi.incidentAnalysis({ log_text: logText });
      setIncident(data);
    } finally {
      setAnalyzing(false);
    }
  }

  const maxRevenue = analytics?.revenue_by_day.reduce((m, d) => Math.max(m, d.revenue), 0) || 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminNav active="dashboard" />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Users" value={stats?.total_users} />
        <Stat label="Products" value={stats?.total_products} />
        <Stat label="Orders" value={stats?.total_orders} />
        <Stat label="Revenue" value={stats ? `$${Number(stats.total_revenue).toFixed(2)}` : undefined} />
        <Stat label="Low stock" value={stats?.low_stock_products} accent={stats?.low_stock_products > 0} />
      </div>

      {/* AI Sales Analytics */}
      <div className="mt-8 rounded-lg border border-line bg-slate p-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-signal">AI sales analytics</h2>
        {!analytics ? (
          <p className="mt-3 text-sm text-fog">loading…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/90">{analytics.ai_insight}</p>

            <div className="mt-5 flex h-28 items-end gap-1">
              {analytics.revenue_by_day.map((d) => (
                <div key={d.date} className="flex-1" title={`${d.date}: $${d.revenue.toFixed(2)}`}>
                  <div
                    className="rounded-t bg-copper/70"
                    style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 100)}px` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-fog">Revenue, last 14 days</p>

            {analytics.top_products.length > 0 && (
              <div className="mt-5">
                <p className="font-mono text-xs uppercase text-fog">Top products</p>
                <div className="mt-2 space-y-1">
                  {analytics.top_products.map((p) => (
                    <div key={p.name} className="flex justify-between text-sm">
                      <span className="text-white/90">{p.name}</span>
                      <span className="font-mono text-fog">{p.units_sold} sold · ${p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Incident Assistant */}
      <div className="mt-8 rounded-lg border border-line bg-slate p-5">
        <h2 className="font-mono text-xs uppercase tracking-wide text-signal">AI incident assistant</h2>
        <p className="mt-1 text-sm text-fog">Paste application error logs to get a root cause analysis and suggested fixes.</p>
        <form onSubmit={handleAnalyzeLog} className="mt-3">
          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            rows={5}
            placeholder="Paste stack trace or log lines here…"
            className="w-full rounded-md border border-line bg-slate-light px-3 py-2 font-mono text-xs text-white placeholder:text-fog"
          />
          <button type="submit" disabled={analyzing} className="mt-3 rounded-md bg-copper px-4 py-2 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50">
            {analyzing ? "Analyzing…" : "Analyze log"}
          </button>
        </form>

        {incident && (
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <p><span className="font-mono text-xs uppercase text-copper">Root cause: </span>{incident.root_cause}</p>
            <p><span className="font-mono text-xs uppercase text-copper">Severity: </span>{incident.severity}</p>
            <p className="text-fog">{incident.summary}</p>
            {incident.suggested_fixes.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-fog">
                {incident.suggested_fixes.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-line bg-slate p-4">
      <p className="font-mono text-[11px] uppercase tracking-wide text-fog">{label}</p>
      <p className={`mt-1 font-display text-2xl font-700 ${accent ? "text-copper" : "text-white"}`}>{value ?? "—"}</p>
    </div>
  );
}

export function AdminNav({ active }) {
  const tabs = [
    ["dashboard", "Dashboard", "/admin"],
    ["products", "Products", "/admin/products"],
    ["orders", "Orders & Users", "/admin/orders"],
  ];
  return (
    <div className="flex gap-2 border-b border-line pb-3">
      {tabs.map(([key, label, href]) => (
        <Link
          key={key}
          to={href}
          className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wide ${
            active === key ? "bg-copper text-ink" : "text-fog hover:text-white"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
