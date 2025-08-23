"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookCopy,
  CalendarCheck2,
  Home,
  LayoutGrid,
  Settings,
  Users,
  Warehouse,
  Clock,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarCheck2 },
  { href: "/admin/courses", label: "Courses", icon: BookCopy },
  { href: "/admin/personnel", label: "Personnel", icon: Users },
  { href: "/admin/rooms", label: "Rooms", icon: Warehouse },
  { href: "/admin/programs", label: "Programs", icon: LayoutGrid },
  { href: "/admin/availability-templates", label: "Availability", icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Settings className="h-6 w-6" />
          <span className="">Scheduler Admin</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === href && "bg-muted text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
