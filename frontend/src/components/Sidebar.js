"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import Link from "next/link";
import CreateNewClipboardModal from "./modals/CreateNewClipboard";
import TooltipWrapper from "./primitives/TooltipWrapper";
import ClipseLogo from "./ClipseLogo";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/api/auth";
import { useUser } from "@/context/UserContext";
import { useClipboards } from "@/context/ClipboardContext";
import { createClipboard } from "@/api/clipboard";

const navItems = [
  {
    name: "Clipboards",
    href: "/clipboards",
    icon: ClipboardList,
    isOpen: true,
    children: [],
  },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const { UserData, loading: userLoading } = useUser();
  const { ClipboardsData, loading: clipboardsLoading, refresh: refreshClipboards } = useClipboards();

  const [userInfo, setUserInfo] = useState({});
  const [navigationItems, setNavigationItems] = useState(navItems);
  const [createNewClipboardModalOpen, setCreateNewClipboardModalOpen] = useState(false);
  const [clipboardCreationFailure, setClipboardCreationFailure] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);

  useEffect(() => {
    if (!clipboardsLoading && ClipboardsData) {
      setNavigationItems((prev) =>
        prev.map((item) =>
          item.name === "Clipboards"
            ? { ...item, children: ClipboardsData.map((c) => ({ id: c.id, name: c.name, color: c.color })) }
            : item
        )
      );
    }
  }, [ClipboardsData, clipboardsLoading]);

  useEffect(() => {
    if (!userLoading) setUserInfo(UserData);
  }, [UserData, userLoading]);

  const toggle = (name) => {
    setNavigationItems((prev) =>
      prev.map((item) => (item.name === name ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleCreateNewClipboard = async (clipboardData) => {
    try {
      await createClipboard(clipboardData);
      await refreshClipboards();
      setCreateNewClipboardModalOpen(false);
      setClipboardCreationFailure(false);
    } catch (error) {
      setClipboardCreationFailure(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Could not logout", err);
    }
  };

  const initials =
    `${userInfo?.first_name?.[0] ?? ""}${userInfo?.last_name?.[0] ?? ""}`.toUpperCase() || "·";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-surface transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-5">
        <ClipseLogo href="/dashboard" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:text-ink lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scroll-slim">
        <NavLink
          href="/dashboard"
          icon={Home}
          active={pathname === "/dashboard"}
          onNavigate={onClose}
        >
          Dashboard
        </NavLink>

        {navigationItems.map(({ name, href, icon: Icon, isOpen, children }) => (
          <div key={name} className="mt-1">
            <div className="group flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-muted">
              <button
                type="button"
                onClick={() => toggle(name)}
                className="grid h-5 w-5 place-items-center rounded text-faint transition-colors hover:text-ink"
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1 font-medium text-ink">{name}</span>
              <TooltipWrapper label="New clipboard">
                <button
                  type="button"
                  onClick={() => setCreateNewClipboardModalOpen(true)}
                  className="grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-accent"
                  aria-label="New clipboard"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipWrapper>
            </div>

            {isOpen && (
              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
                {children?.length === 0 && (
                  <span className="px-2 py-1.5 text-xs text-faint">No clipboards yet</span>
                )}
                {children?.map((child) => {
                  const childHref = `${href}/${child.id}`;
                  const active = pathname === childHref;
                  return (
                    <Link
                      key={child.id ?? child.name}
                      href={childHref}
                      onClick={onClose}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-muted hover:bg-raised hover:text-ink"
                      }`}
                    >
                      {child.color ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: child.color }}
                        />
                      ) : (
                        <span className="font-mono text-xs text-faint">#</span>
                      )}
                      <span className="truncate">{child.name}</span>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCreateNewClipboardModalOpen(true)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-faint transition-colors hover:text-accent"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New clipboard
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer: theme + profile */}
      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-faint">Theme</span>
          <ThemeToggle />
        </div>

        <div className="relative">
          {userSettingsOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow)]">
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-faint">
                Account
              </div>
              <button
                onClick={() => {
                  setUserSettingsOpen(false);
                  onClose();
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
              >
                <Settings className="h-4 w-4 text-muted" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
              >
                <LogOut className="h-4 w-4 text-accent" />
                Log out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserSettingsOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-raised"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">
                {userInfo?.first_name
                  ? `${userInfo.first_name} ${userInfo.last_name ?? ""}`.trim()
                  : "Account"}
              </span>
              <span className="block truncate text-xs text-faint">{userInfo?.email ?? ""}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-faint transition-transform ${userSettingsOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <CreateNewClipboardModal
        isOpen={createNewClipboardModalOpen}
        onClose={() => setCreateNewClipboardModalOpen(false)}
        onConfirm={handleCreateNewClipboard}
        clipboardCreationFailure={clipboardCreationFailure}
      />
    </aside>
  );
}

function NavLink({ href, icon: Icon, active, children, onNavigate }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-raised hover:text-ink"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
      {children}
    </Link>
  );
}
