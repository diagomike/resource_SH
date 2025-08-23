import Link from "next/link";
import { Menu, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar"; // Re-use the sidebar for the mobile sheet

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          {/* We can reuse the same Sidebar component */}
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-semibold md:text-base"
        >
          <Settings className="h-6 w-6" />
          <span>Scheduler Admin</span>
        </Link>
      </div>
    </header>
  );
}
