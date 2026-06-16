"use client";
import { useState, useEffect } from "react";

export default function TooltipWrapper({ label, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return children;

  return (
    <span className="group/tip relative inline-flex items-center">
      {children}
      <span
        className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-ink px-2 py-1 text-xs font-medium text-bg opacity-0 shadow-[var(--shadow)] transition-opacity duration-150 group-hover/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
