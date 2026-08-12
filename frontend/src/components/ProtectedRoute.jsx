import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <CenteredLoading />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <CenteredLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

function CenteredLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="font-mono text-sm text-fog">loading…</p>
    </div>
  );
}
