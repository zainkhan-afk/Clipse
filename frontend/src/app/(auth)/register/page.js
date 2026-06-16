"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { register } from "@/api/auth";

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

  async function handleRegistration(e) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await register(registrationData);
      if (data.access_token) {
        router.push("/dashboard");
      } else {
        // Registration succeeded but no session yet — send them to sign in.
        router.push("/login");
      }
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  const set = (key) => (v) => setRegistrationData({ ...registrationData, [key]: v });

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
