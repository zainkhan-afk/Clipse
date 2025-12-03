"use client";
import { useState, useEffect } from "react";

export default function TooltipWrapper({ label, children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return children;

  
  return (
    <div className="relative group inline-flex items-center">
      {/* Wrapped element (icon, link, button, anything) */}
      <div className="cursor-pointer inline-flex items-center">
        {children}
      </div>

      {/* Tooltip */}
      <span className="
          absolute left-1/2 -translate-x-1/2 -top-8
          bg-black text-white text-xs
          px-2 py-1 rounded
          opacity-0 group-hover:opacity-100
          transition pointer-events-none
          whitespace-nowrap
        "
      >
        {label}
      </span>
    </div>
  );
}
