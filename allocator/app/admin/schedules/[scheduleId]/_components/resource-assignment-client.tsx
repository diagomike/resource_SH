"use client";

import { useState } from "react";
import {
  ScheduleInstance,
  Course,
  User,
  Room,
  Section,
  Batch,
  Program,
  AvailabilityTemplate,
} from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; // Import Button
import { toast } from "sonner"; // Import toast
import { Loader2, Zap } from "lucide-react"; // Import icons for loading and trigger
import { CoursesAssignmentTab } from "./courses-assignment-tab";
import { PersonnelAssignmentTab } from "./personnel-assignment-tab";
import { RoomsAssignmentTab } from "./rooms-assignment-tab";
import { AttendeesAssignmentTab } from "./attendees-assignment-tab";
import { PreviewTab } from "./preview-assignments-tab";
import { triggerAllocation } from "@/lib/actions"; // Import the server action

// Define a more specific type for Sections with their parent relations
export type SectionWithRelations = Section & {
  batch: Batch & {
    program: Program;
  };
};

interface ResourceAssignmentClientProps {
  scheduleInstance: ScheduleInstance & {
    courses: Course[];
    personnel: User[];
    rooms: Room[];
    sections: Section[];
    availabilityTemplate?: AvailabilityTemplate | null;
  };
  allCourses: Course[];
  allPersonnel: User[];
  allRooms: Room[];
  allSections: SectionWithRelations[];
  availabilityTemplates: AvailabilityTemplate[];
}

export function ResourceAssignmentClient({
  scheduleInstance,
  allCourses,
  allPersonnel,
  allRooms,
  allSections,
  availabilityTemplates,
}: ResourceAssignmentClientProps) {
  const [isAllocating, setIsAllocating] = useState(false);

  const scheduleInstanceWithRelations = {
    ...scheduleInstance,
    courses: scheduleInstance.courses,
    personnel: scheduleInstance.personnel,
    rooms: scheduleInstance.rooms,
    sections: scheduleInstance.sections as SectionWithRelations[],
    availabilityTemplate: scheduleInstance.availabilityTemplate ?? null,
  };

  const handleTriggerAllocation = async () => {
    setIsAllocating(true);
    toast.info("Starting allocation process...");
    try {
      const result = await triggerAllocation(scheduleInstance.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to trigger allocation:", error);
      toast.error("An unexpected error occurred during allocation.");
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleTriggerAllocation}
          disabled={
            isAllocating ||
            scheduleInstance.status === "COMPLETED" ||
            scheduleInstance.status === "LOCKED"
          }
          className="bg-blue-600 hover:bg-blue-700 rounded-md px-6 py-2"
        >
          {isAllocating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {scheduleInstance.status === "COMPLETED"
            ? "Allocation Completed"
            : scheduleInstance.status === "LOCKED"
            ? "Allocation in Progress..."
            : "Trigger Allocation"}
        </Button>
      </div>
      <Tabs defaultValue="preview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <PreviewTab
            scheduleInstance={scheduleInstanceWithRelations}
            availabilityTemplates={availabilityTemplates}
          />
        </TabsContent>
        <TabsContent value="courses">
          <CoursesAssignmentTab
            scheduleInstance={scheduleInstance}
            allCourses={allCourses}
          />
        </TabsContent>
        <TabsContent value="personnel">
          <PersonnelAssignmentTab
            scheduleInstance={scheduleInstance}
            allPersonnel={allPersonnel}
          />
        </TabsContent>
        <TabsContent value="rooms">
          <RoomsAssignmentTab
            scheduleInstance={scheduleInstance}
            allRooms={allRooms}
          />
        </TabsContent>
        <TabsContent value="attendees">
          <AttendeesAssignmentTab
            scheduleInstance={scheduleInstance}
            allSections={allSections}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
