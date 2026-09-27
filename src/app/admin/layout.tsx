import type { Metadata } from "next";
import { requirePermission } from "@/lib/session";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

// Hides the whole section from non-staff. Pages and actions still check permissions themselves.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requirePermission({ user: ["list"] });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Quản trị</p>
        <h1 className="text-2xl font-extrabold md:text-3xl">Người dùng</h1>
      </header>
      {children}
    </div>
  );
}
