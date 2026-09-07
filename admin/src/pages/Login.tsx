import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingField";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-brand-900/65 to-slate-900/85" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 animate-float rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 animate-float rounded-full bg-indigo-500/25 blur-3xl [animation-delay:2s]" />

      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-white/15 bg-white/95 p-8 shadow-elevated backdrop-blur-xl">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white shadow-glow-lg">
            VJ
          </div>
        </div>
        <h1 className="text-center text-lg font-semibold text-slate-900">VJA Central Admin</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Sign in to manage app content</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <FloatingInput label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FloatingInput label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
