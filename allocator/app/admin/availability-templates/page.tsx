import { getAllAvailabilityTemplates } from "@/lib/actions";
import { AvailabilityClientPage } from "./_components/client-page";

export default async function AvailabilityTemplatesPage() {
  const templates = await getAllAvailabilityTemplates();

  return (
    <div className="container mx-auto py-10">
      <AvailabilityClientPage templates={templates} />
    </div>
  );
}
