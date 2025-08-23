import { ReactNode } from "react";
import { Sidebar } from "./_components/sidebar";
import { Header } from "./_components/header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar for Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <Sidebar />
      </div>

      <div className="flex flex-col">
        {/* Header for Mobile */}
        <Header />

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
