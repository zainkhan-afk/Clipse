"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { register, resendVerification } from "@/api/auth";

export default function Register() {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  async function handleRegistration(e) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await register(registrationData);
      if (data?.verification_skipped) {
        // Local/dev: no email step — the account is ready to use.
        router.push("/login?registered=1");
      } else {
        // Account created; user must confirm their email before they can sign in.
        setSentTo(registrationData.email);
      }
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setResendMsg("");
    setResending(true);
    try {
      const data = await resendVerification(sentTo);
      setResendMsg(data?.message || "Verification email sent.");
    } catch (err) {
      setResendMsg(err.message || "Couldn't resend right now.");
    } finally {
      setResending(false);
    }
  }

  const set = (key) => (v) => setRegistrationData({ ...registrationData, [key]: v });

  if (sentTo) {
    return (
      <div className="w-full max-w-sm animate-rise text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          We sent a verification link to{" "}
          <span className="font-medium text-ink">{sentTo}</span>. Click it to activate your
          account, then sign in. The link expires in 24 hours.
        </p>

        {resendMsg && (
          <p className="mt-4 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
            {resendMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-6 w-full rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-line-strong disabled:opacity-60"
        >
          {resending ? "Sending…" : "Resend email"}
        </button>

        <p className="mt-6 text-sm text-muted">
          Already verified?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegistration} className="w-full max-w-sm animate-rise">
      <h2 className="text-2xl">Create your account</h2>
      <p className="mt-1.5 text-sm text-muted">Start syncing your clipboard in seconds.</p>

      <div className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" placeholder="Ada" autoComplete="given-name"
            value={registrationData.first_name} onChange={set("first_name")} />
          <Field label="Last name" placeholder="Lovelace" autoComplete="family-name"
            value={registrationData.last_name} onChange={set("last_name")} />
        </div>
        <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email"
          value={registrationData.email} onChange={set("email")} />
        <Field label="Password" type="password" placeholder="••••••••" autoComplete="new-password"
          value={registrationData.password} onChange={set("password")} />
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
        {busy ? "Creating…" : "Create account"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
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
