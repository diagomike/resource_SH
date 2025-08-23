import { prisma } from "@/prisma/client";
import {
  BookCopy,
  Calendar as CalendarIcon,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleStatus } from "@prisma/client";

// Data fetching function for the dashboard stats
async function getDashboardStats() {
  const [courseCount, personnelCount, roomCount, scheduleCount] =
    await prisma.$transaction([
      prisma.course.count(),
      prisma.user.count(),
      prisma.room.count(),
      prisma.scheduleInstance.count({
        where: { NOT: { status: "COMPLETED" } },
      }),
    ]);

  const activeSchedules = await prisma.scheduleInstance.findMany({
    where: { NOT: { status: "COMPLETED" } },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  return {
    courseCount,
    personnelCount,
    roomCount,
    scheduleCount,
    activeSchedules,
  };
}

export default async function AdminDashboardPage() {
  const {
    courseCount,
    personnelCount,
    roomCount,
    scheduleCount,
    activeSchedules,
  } = await getDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/schedules/create">Create New Schedule</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Active Schedules"
          value={scheduleCount}
          icon={<CalendarIcon className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Courses"
          value={courseCount}
          icon={<BookCopy className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Personnel"
          value={personnelCount}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Rooms"
          value={roomCount}
          icon={<Warehouse className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Active Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Active Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSchedules.length > 0 ? (
                activeSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.name}
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/schedules/${schedule.id}`}>
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No active schedules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Helper to style status badges
function getBadgeVariant(status: ScheduleStatus) {
  switch (status) {
    case "DRAFT":
      return "secondary";
    case "LOCKED":
      return "default";
    case "COMPLETED":
      return "outline";
    default:
      return "secondary";
  }
}
