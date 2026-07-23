import ClipseLogo from "@/components/ClipseLogo";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Clipse — sign in",
  description: "A calm, minimal clipboard you can reach from any device.",
};

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Brand / atmosphere panel — hidden on small screens */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex">
        {/* concentric radar rings */}
        <div className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-line"
              style={{
                width: `${(i + 1) * 220}px`,
                height: `${(i + 1) * 220}px`,
                left: `${-(i + 1) * 110}px`,
                top: `${-(i + 1) * 110}px`,
              }}
            />
          ))}
          <span className="blip-dot absolute h-3 w-3" />
        </div>

        <ClipseLogo />

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Your clipboard,
            <br />
            everywhere at once.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Copy on one device, paste on another. Clipse keeps your snippets and
            images in sync — quietly, instantly.
          </p>
        </div>

        <p className="relative font-mono text-xs text-faint">
          {"// copy · sync · paste"}
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="absolute right-5 top-5 flex items-center gap-3 lg:right-8 lg:top-8">
          <ThemeToggle />
        </div>

        <div className="mb-8 lg:hidden">
          <ClipseLogo />
        </div>

        {children}
      </main>
    </div>
  );
}
