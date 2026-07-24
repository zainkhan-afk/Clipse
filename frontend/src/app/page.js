import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClipseLogo from "@/components/ClipseLogo";
import ThemeToggle from "@/components/ThemeToggle";

// Faint "copy → paste" marks for the hero backdrop, replacing the old radar rings.
// Each is a clipboard card with an offset duplicate behind it — the universal copy
// glyph — placed to frame the hero (not sit behind the headline), one picked out in
// the vermilion accent. They drift gently (see .copy-mark in globals.css).
const COPY_MARKS = [
  { left: "8%", top: "24%", size: 118, rot: -11, opacity: 0.75, accent: false },
  { left: "82%", top: "16%", size: 84, rot: 9, opacity: 0.9, accent: true },
  { left: "87%", top: "60%", size: 150, rot: -6, opacity: 0.6, accent: false },
  { left: "13%", top: "70%", size: 100, rot: 8, opacity: 0.7, accent: false },
  { left: "49%", top: "88%", size: 66, rot: -9, opacity: 0.5, accent: false },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg text-ink">
      {/* copy → paste marks: a card and its offset duplicate — the clipboard-copy
          glyph — framing the hero (replaces the old radar rings) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {COPY_MARKS.map((m, i) => (
          <div
            key={i}
            className="copy-mark absolute"
            style={{
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              opacity: m.opacity,
              animationDelay: `${i * -1.9}s`,
            }}
          >
            <div className="h-full w-full" style={{ transform: `rotate(${m.rot}deg)` }}>
              {/* back card (the source), peeking out top-left */}
              <div
                className="absolute inset-0 rounded-[24%] border border-line"
                style={{ transform: "translate(-15%, -15%)" }}
              />
              {/* front card (the duplicate) — filled with the page bg so it occludes
                  the back into the familiar copy glyph */}
              <div
                className={`absolute inset-0 rounded-[24%] border bg-bg ${
                  m.accent ? "border-accent/60" : "border-line"
                }`}
              />
            </div>
          </div>
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
