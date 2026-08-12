import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.full_name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-700 text-white">Create your account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full name" type="text" value={form.full_name} onChange={(v) => setForm((f) => ({ ...f, full_name: v }))} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <Field label="Password (min 8 characters)" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
        {error && <p className="text-sm text-copper">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-copper px-4 py-2.5 text-sm font-medium text-ink hover:bg-copper-light disabled:opacity-50">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-fog">
        Already have an account?{" "}
        <Link to="/login" className="text-copper hover:text-copper-light">
          Sign in
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
        minLength={type === "password" ? 8 : undefined}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-line bg-slate px-4 py-2.5 text-sm text-white focus:border-copper"
      />
    </div>
  );
}
