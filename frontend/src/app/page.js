import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClipseLogo from "@/components/ClipseLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg text-ink">
      {/* concentric rings backdrop */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-line"
            style={{
              width: `${(i + 1) * 180}px`,
              height: `${(i + 1) * 180}px`,
              left: `${-(i + 1) * 90}px`,
              top: `${-(i + 1) * 90}px`,
            }}
          />
        ))}
      </div>

      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <ClipseLogo />
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-faint">copy · sync · paste</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          One clipboard for
          <br />
          all your devices.
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          Clipse keeps your text and images in sync across everything you own. Copy here, paste
          there — no cables, no fuss.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Open Clipse
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
          >
            Sign in
          </Link>
        </div>
      </main>

      <footer className="relative px-6 py-6 text-center font-mono text-xs text-faint">
        clipse — shared clipboard
      </footer>
    </div>
  );
}
