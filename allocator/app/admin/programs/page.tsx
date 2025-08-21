import { getProgramsWithChildren } from "@/lib/actions";
import { ProgramStructureClient } from "./_components/program-structure-client";

export default async function ProgramsPage() {
  const programs = await getProgramsWithChildren();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Academic Structure</h1>
      </div>
      <ProgramStructureClient programs={programs} />
    </div>
  );
}
