"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { resetPassword } from "@/api/auth";

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState(null); // null = still reading, "" = missing
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Pull the token out of the URL after mount (avoids needing a Suspense boundary).
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err.message || "Couldn't reset your password. The link may have expired.");
    } finally {
      setBusy(false);
    }
  }

  // Link opened without a token — nothing to do.
  if (token === "") {
    return (
      <div className="w-full max-w-sm animate-rise text-center">
        <h2 className="text-2xl">Invalid reset link</h2>
        <p className="mt-2 text-sm text-muted">
          This link is missing its token or has expired. Request a new one to continue.
        </p>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Request a new link
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm animate-rise">
      <h2 className="text-2xl">Choose a new password</h2>
      <p className="mt-1.5 text-sm text-muted">Pick something at least 8 characters long.</p>

      <div className="mt-8 flex flex-col gap-4">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
        />
        <Field
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={setConfirm}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || token === null}
        className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? "Updating…" : "Update password"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          Back to sign in
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
