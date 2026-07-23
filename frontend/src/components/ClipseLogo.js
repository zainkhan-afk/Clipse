import Link from "next/link";

/**
 * Wordmark for Clipse — a vermilion radar ping dot followed by the name
 * set in mono. `href` makes it a link; omit for a plain mark.
 */
export default function ClipseLogo({ href, className = "", showPing = true }) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={showPing ? "ping-dot" : "ping-dot before:hidden after:hidden"} />
      <span className="font-mono text-[15px] font-medium lowercase tracking-tight text-ink">
        clipse
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return inner;
}
