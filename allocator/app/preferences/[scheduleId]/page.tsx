import { prisma } from "@/prisma/client";
import { PreferenceSorterClient } from "./_components/preference-sorter";
import { notFound } from "next/navigation";

type PreferencesPageProps = {
  params: Promise<{ scheduleId: string }>;
  searchParams: Promise<{ token?: string }>;
};

// This Server Component acts as a secure data loader
export default async function PreferencesPage({
  params,
  searchParams,
}: PreferencesPageProps) {
  const { scheduleId } = await params;
  const { token } = await searchParams;

  if (!token) {
    return notFound();
  }

  // 1. Find the user associated with the token
  const user = await prisma.user.findUnique({
    where: { preferenceToken: token },
  });
  if (!user) {
    return notFound();
  }

  // 2. Find the schedule and ensure this user is part of it
  const schedule = await prisma.scheduleInstance.findFirst({
    where: {
      id: scheduleId,
      personnel: { some: { id: user.id } },
    },
    include: {
      courses: { include: { activityTemplates: true } },
      preferences: { where: { personnelId: user.id } },
    },
  });

  if (!schedule) {
    return (
      <div className="container mx-auto py-10">
        You are not assigned to this schedule.
      </div>
    );
  }

  // 3. Filter activities relevant to the user's roles
  const availableActivities = schedule.courses.flatMap(
    (course) =>
      course.activityTemplates
        .filter((template) =>
          template.requiredPersonnel.some((req) =>
            user.roles.includes(req.role)
          )
        )
        .map((template) => ({ ...template, course })) // Add course info to template
  );

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Set Your Preferences</h1>
        <p className="text-muted-foreground">For schedule: {schedule.name}</p>
        <p>
          Welcome, {user.name}. Please drag and drop the activities to rank them
          in your preferred order.
        </p>
      </div>
      <PreferenceSorterClient
        personnelId={user.id}
        scheduleInstanceId={schedule.id}
        availableActivities={availableActivities}
        existingPreferences={schedule.preferences}
      />
    </div>
  );
}
