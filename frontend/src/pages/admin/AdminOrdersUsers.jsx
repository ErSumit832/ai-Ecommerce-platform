import { useEffect, useState } from "react";
import { adminApi, ordersApi } from "../../api/endpoints";
import { AdminNav } from "./AdminDashboard";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersUsers() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [o, u] = await Promise.all([ordersApi.adminList(), adminApi.users()]);
    setOrders(o.data);
    setUsers(u.data);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(orderId, status) {
    await ordersApi.adminUpdateStatus(orderId, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  async function handleToggleActive(userId) {
    const { data } = await adminApi.toggleUserActive(userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: data.is_active } : u)));
  }

  if (loading) return <p className="mx-auto max-w-7xl px-4 py-16 font-mono text-sm text-fog sm:px-6">loading…</p>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminNav active="orders" />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Orders ({orders.length})</h2>
          <div className="mt-3 space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-line bg-slate p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs text-fog">#{o.tracking_number || o.id.slice(0, 8)}</p>
                  <p className="font-mono text-sm text-white">${Number(o.total_amount).toFixed(2)}</p>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  className="mt-2 rounded-md border border-line bg-slate-light px-2 py-1 font-mono text-xs text-white"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-mono text-xs uppercase tracking-wide text-fog">Users ({users.length})</h2>
          <div className="mt-3 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-line bg-slate p-3">
                <div>
                  <p className="text-sm text-white">{u.full_name}</p>
                  <p className="font-mono text-xs text-fog">{u.email} · {u.role}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(u.id)}
                  className={`rounded-md px-3 py-1 font-mono text-xs ${u.is_active ? "border border-line text-fog hover:text-white" : "bg-copper text-ink"}`}
                >
                  {u.is_active ? "active" : "disabled"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
