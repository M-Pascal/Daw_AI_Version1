import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full">
      <AppSidebar fullName={session.fullName} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-8">
        {children}
      </main>
    </div>
  );
}
