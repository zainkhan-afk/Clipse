import AppShell from "@/components/AppShell";
import { UserProvider } from "@/context/UserContext";
import { ClipboardsProvider } from "@/context/ClipboardContext";

export const metadata = {
  title: "Clipse",
  description: "A calm, minimal clipboard you can reach from any device.",
};

export default function ProtectedLayout({ children }) {
  return (
    <UserProvider>
      <ClipboardsProvider>
        <AppShell>{children}</AppShell>
      </ClipboardsProvider>
    </UserProvider>
  );
}
