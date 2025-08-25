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
import { AllocationModal } from "./allocation-modal";
import { Dialog } from "@/components/ui/dialog";

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
  // const [isLoading, setIsLoading] = useState(false); // Can be removed if only used for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control the modal

  const scheduleInstanceWithRelations = {
    ...scheduleInstance,
    courses: scheduleInstance.courses,
    personnel: scheduleInstance.personnel,
    rooms: scheduleInstance.rooms,
    sections: scheduleInstance.sections as SectionWithRelations[],
    availabilityTemplate: scheduleInstance.availabilityTemplate ?? null,
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Manage Schedule</h1>
        {/* This button now opens the modal */}
        <Button onClick={() => setIsModalOpen(true)}>
          <Zap className="mr-2 h-4 w-4" />
          Run Allocation
        </Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AllocationModal
          scheduleInstanceId={scheduleInstance.id}
          onClose={() => setIsModalOpen(false)}
        />
      </Dialog>

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
