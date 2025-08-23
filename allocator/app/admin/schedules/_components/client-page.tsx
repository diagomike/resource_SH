"use client";

import { useState } from "react";
import { ScheduleInstance, AvailabilityTemplate } from "@prisma/client"; // Import AvailabilityTemplate
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SchedulesTable } from "./schedules-table";
import { ScheduleForm } from "./schedule-form";

interface ScheduleClientPageProps {
  schedules: ScheduleInstance[];
  availabilityTemplates: AvailabilityTemplate[]; // Add availabilityTemplates to props
}

export function ScheduleClientPage({
  schedules,
  availabilityTemplates,
}: ScheduleClientPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    // Revalidation is handled by the server action
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schedule Instances</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Schedule
        </Button>
      </div>
      <SchedulesTable schedules={schedules} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
            <DialogDescription>
              Define a new scheduling period. You can assign resources to it in
              the next step.
            </DialogDescription>
          </DialogHeader>
          <ScheduleForm
            onSuccess={handleSuccess}
            availabilityTemplates={availabilityTemplates}
          />{" "}
          {/* Pass availabilityTemplates to ScheduleForm */}
        </DialogContent>
      </Dialog>
    </>
  );
}
