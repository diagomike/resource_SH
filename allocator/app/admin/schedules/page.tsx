import { getAllScheduleInstances } from "@/lib/actions";
import { ScheduleClientPage } from "./_components/client-page";

export default async function SchedulesPage() {
  const schedules = await getAllScheduleInstances();

  return (
    <div className="container mx-auto py-10">
      <ScheduleClientPage schedules={schedules} />
    </div>
  );
}
