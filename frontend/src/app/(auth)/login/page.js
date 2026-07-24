"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { login } from "@/api/auth";

export default function Login() {
  const router = useRouter();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(null);
  const [reset, setReset] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Read flags set by redirects: `verified` (post email-verification), `reset`
  // (after a password reset), and `registered` (sign-up with email skipped).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("verified");
    if (flag === "1" || flag === "0") setVerified(flag);
    if (params.get("reset") === "1") setReset(true);
    if (params.get("registered") === "1") setRegistered(true);
  }, []);

  async function handleLogin(e) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await login(loginData);
      if (data.access_token) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm animate-rise">
      <h2 className="text-2xl">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">Sign in to reach your clipboards.</p>

      {verified === "1" && (
        <p className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          Email verified — you can sign in now.
        </p>
      )}
      {verified === "0" && (
        <p className="mt-6 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
          That verification link is invalid or expired. Try resending it from the sign-up page.
        </p>
      )}
      {reset && (
        <p className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          Password updated — sign in with your new password.
        </p>
      )}
      {registered && (
        <p className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          Account created — sign in to get started.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={loginData.email}
          onChange={(v) => setLoginData({ ...loginData, email: v })}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={loginData.password}
          onChange={(v) => setLoginData({ ...loginData, password: v })}
        />
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="-mt-1 self-end text-xs font-medium text-muted underline-offset-4 hover:text-accent hover:underline"
        >
          Forgot password?
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          Create one
        </button>
      </p>
    </form>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <input
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}
