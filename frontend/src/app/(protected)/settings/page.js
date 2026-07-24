"use client";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check, ShieldCheck, AlertCircle } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import {
  updateProfile,
  changePassword,
  resendVerification,
  deleteAccount,
} from "@/api/auth";
import ConfirmDialog from "@/components/ConfirmDialog";
import { passwordProblem, PASSWORD_HINT } from "@/lib/password";

export default function Settings() {
  const { UserData, refresh } = useUser();
  const { preference, setPreference } = useTheme();

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="animate-rise">
        <p className="font-mono text-xs uppercase tracking-wider text-faint">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-[15px] text-muted">
          Manage your profile, security, and appearance.
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-6">
        <ProfileSection user={UserData} refresh={refresh} />
        <SecuritySection />
        <AppearanceSection preference={preference} setPreference={setPreference} />
        <DangerSection email={UserData?.email ?? ""} />
      </div>
    </div>
  );
}

function ProfileSection({ user, refresh }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
    }
  }, [user]);

  const dirty =
    user &&
    (firstName.trim() !== (user.first_name || "") ||
      (lastName.trim() || "") !== (user.last_name || ""));
  const canSave = dirty && firstName.trim().length > 0;

  async function save() {
    setMsg(null);
    setSaving(true);
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() || null });
      await refresh();
      setMsg({ ok: true, text: "Profile updated." });
    } catch (e) {
      setMsg({ ok: false, text: e.message || "Couldn't save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function resend() {
    setResendMsg("");
    try {
      const d = await resendVerification(user.email);
      setResendMsg(d?.message || "Verification email sent.");
    } catch (e) {
      setResendMsg(e.message || "Couldn't resend right now.");
    }
  }

  return (
    <Card title="Profile" description="Your name and email address.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name" value={lastName} onChange={setLastName} />
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Email</span>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate rounded-xl border border-line bg-raised/40 px-3.5 py-2.5 text-sm text-muted">
            {user?.email ?? "—"}
          </span>
          {user?.is_verified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" /> Unverified
            </span>
          )}
        </div>
        {user && !user.is_verified && (
          <div className="mt-2">
            <button
              onClick={resend}
              className="text-xs font-medium text-accent underline-offset-4 hover:underline"
            >
              Resend verification email
            </button>
            {resendMsg && <p className="mt-1 text-xs text-faint">{resendMsg}</p>}
          </div>
        )}
      </div>

      {msg && (
        <p className={`mt-4 text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-accent"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-5">
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Card>
  );
}

function SecuritySection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const canSave = current.length > 0 && !passwordProblem(next) && next === confirm;

  async function save() {
    setMsg(null);
    const pwErr = passwordProblem(next);
    if (pwErr) {
      setMsg({ ok: false, text: pwErr });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      setMsg({ ok: true, text: "Password changed." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      setMsg({ ok: false, text: e.message || "Couldn't change password." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Security" description="Change your password.">
      <div className="flex flex-col gap-3">
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
        />
        <Field
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
        />
        <p className="text-xs text-faint">{PASSWORD_HINT}</p>
      </div>

      {msg && (
        <p className={`mt-4 text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-accent"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-5">
        <button
          onClick={save}
          disabled={!canSave || saving}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </Card>
  );
}

function AppearanceSection({ preference, setPreference }) {
  const options = [
    { key: "light", label: "Light", Icon: Sun },
    { key: "dark", label: "Dark", Icon: Moon },
    { key: "system", label: "System", Icon: Monitor },
  ];
  return (
    <Card title="Appearance" description="Choose how Clipse looks.">
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setPreference(key)}
            className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-colors ${
              preference === key
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted hover:border-line-strong"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function DangerSection({ email }) {
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const matches = email.length > 0 && confirmText.trim().toLowerCase() === email.toLowerCase();

  async function reallyDelete() {
    setBusy(true);
    setErr("");
    try {
      await deleteAccount();
      // Full reload so all contexts/cookies reset cleanly.
      window.location.href = "/login";
    } catch (e) {
      setErr(e.message || "Couldn't delete account.");
      setBusy(false);
      setDialogOpen(false);
    }
  }

  return (
    <section className="animate-rise rounded-2xl border border-accent/30 bg-surface shadow-[var(--shadow)]">
      <div className="border-b border-accent/20 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-accent">Danger zone</h2>
        <p className="mt-1 text-xs text-faint">
          Deleting your account removes all clipboards, messages, and images. This can&apos;t be undone.
        </p>
      </div>
      <div className="p-5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted">
          Type your email to confirm
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={email}
          className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
        {err && <p className="mt-3 text-sm text-accent">{err}</p>}
        <div className="mt-4">
          <button
            disabled={!matches}
            onClick={() => setDialogOpen(true)}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Delete my account
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={reallyDelete}
        busy={busy}
        title="Delete account?"
        confirmLabel="Delete forever"
        message="This permanently deletes your account and every clipboard, message, and image. This cannot be undone."
      />
    </section>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="animate-rise rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {description && <p className="mt-1 text-xs text-faint">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
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
