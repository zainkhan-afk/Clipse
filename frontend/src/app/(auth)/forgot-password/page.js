"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { forgotPassword } from "@/api/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email);
      // The backend always responds the same way (no account enumeration), so a
      // success here just means "we've processed it".
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm animate-rise text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <span className="font-medium text-ink">{email}</span>, we&apos;ve
          sent a link to reset your password. The link expires in 1 hour.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 w-full rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-line-strong"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm animate-rise">
      <h2 className="text-2xl">Forgot your password?</h2>
      <p className="mt-1.5 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
        />
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
        {busy ? "Sending…" : "Send reset link"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
        >
          Sign in
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
