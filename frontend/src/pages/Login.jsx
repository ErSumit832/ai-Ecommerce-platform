import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Sign in</h1>
      <p className="mt-1 text-sm text-fog">Demo admin: admin@ecommerce.local / Admin123!</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
        {error && <p className="text-sm text-copper">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-copper px-4 py-2.5 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-fog">
        No account?{" "}
        <Link to="/register" className="text-copper hover:text-copper-light">
          Create one
        </Link>
      </p>
    </div>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-wide text-fog">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-slate px-4 py-2.5 text-sm text-white focus:border-copper"
      />
    </div>
  );
}
