import {
  getScheduleInstanceDetails,
  getAllAvailabilityTemplates,
} from "@/lib/actions";
import { notFound } from "next/navigation";
import { ResourceAssignmentClient } from "./_components/resource-assignment-client";
import { format } from "date-fns";
import Link from "next/link";

type ScheduleDashboardPageProps = {
  params: Promise<{
    scheduleId: string;
  }>;
};

export default async function ScheduleDashboardPage({
  params,
}: ScheduleDashboardPageProps) {
  const { scheduleId } = await params;
  const data = await getScheduleInstanceDetails(scheduleId);
  const availabilityTemplates = await getAllAvailabilityTemplates(); // Fetch all availability templates

  if (!data) {
    notFound();
  }

  const { scheduleInstance, allCourses, allPersonnel, allRooms, allSections } =
    data;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        {/* Back Button */}
        <div className="mb-2">
          <Link
            href="/admin/schedules"
            className="text-sm hover:underline flex items-center"
          >
            ← Back to schedules
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold">{scheduleInstance.name}</h1>

        {/* Date Range */}
        <p className="text-muted-foreground">
          {format(scheduleInstance.startDate, "PPP")} -{" "}
          {format(scheduleInstance.endDate, "PPP")}
        </p>
      </div>
      <ResourceAssignmentClient
        scheduleInstance={scheduleInstance}
        allCourses={allCourses}
        allPersonnel={allPersonnel}
        allRooms={allRooms}
        allSections={allSections}
        availabilityTemplates={availabilityTemplates} // Pass availabilityTemplates
      />
    </div>
  );
}
