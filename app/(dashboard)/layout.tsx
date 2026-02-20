import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { getUser } from "@/lib/auth/get-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles auth redirect, so user should always exist here
  // If getUser returns null, show minimal header (auth state issue)
  const user = await getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="min-h-screen lg:pl-64">
        <Header user={user} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
