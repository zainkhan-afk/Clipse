"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import BlipLogo from "./BlipLogo";
import ThemeToggle from "./ThemeToggle";

export default function AppShell({ children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink lg:h-screen lg:min-h-0 lg:overflow-hidden">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
        <BlipLogo showPing={false} />
        <ThemeToggle />
      </header>

      {/* Drawer overlay */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <Sidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />

      <main className="flex min-h-screen w-full min-w-0 flex-1 flex-col pt-14 lg:h-screen lg:min-h-0 lg:overflow-y-auto lg:pt-0 scroll-slim">
        {children}
      </main>
    </div>
  );
}
