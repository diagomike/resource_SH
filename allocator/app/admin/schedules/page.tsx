// app/admin/schedules/page.tsx

import {
  getAllScheduleInstances,
  getAllAvailabilityTemplates,
} from "@/lib/actions";
import { ScheduleClientPage } from "./_components/client-page";

export default async function SchedulesPage() {
  // Await both results
  const schedulesResult = await getAllScheduleInstances();
  const templatesResult = await getAllAvailabilityTemplates();

  // Extract the data array if the action was successful, otherwise default to an empty array
  const schedules = schedulesResult.success ? schedulesResult.data : [];

  // NOTE: You should also update getAllAvailabilityTemplates to the new format.
  // Assuming it is also updated, we handle its result the same way.
  const availabilityTemplates = templatesResult.success
    ? templatesResult.data
    : [];

  // You could also add server-side error logging here if needed
  if (!schedulesResult.success) {
    console.error("Failed to load schedules:", schedulesResult.message);
  }
  if (!templatesResult.success) {
    console.error("Failed to load templates:", templatesResult.message);
  }

  return (
    <div className="container mx-auto py-10">
      <ScheduleClientPage
        schedules={schedules || []}
        availabilityTemplates={availabilityTemplates || []}
      />
    </div>
  );
}
