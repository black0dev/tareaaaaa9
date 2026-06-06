import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminHeader from "@/components/layout/AdminHeader";
import AdminSidebar from "@/components/layout/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin - Tienda Camisetas",
  description: "Panel de administración de Tienda Camisetas",
  robots: { index: false, follow: false },
};

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
