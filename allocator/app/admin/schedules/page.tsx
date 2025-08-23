import {
  getAllScheduleInstances,
  getAllAvailabilityTemplates,
} from "@/lib/actions";
import { ScheduleClientPage } from "./_components/client-page";

export default async function SchedulesPage() {
  const schedules = await getAllScheduleInstances();
  // Fetch all availability templates
  const availabilityTemplates = await getAllAvailabilityTemplates();

  return (
    <div className="container mx-auto py-10">
      <ScheduleClientPage
        schedules={schedules}
        availabilityTemplates={availabilityTemplates} // Pass availabilityTemplates to client-page
      />
    </div>
  );
}
