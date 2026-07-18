import { AuthSessionProvider } from "@/components/providers/session-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
