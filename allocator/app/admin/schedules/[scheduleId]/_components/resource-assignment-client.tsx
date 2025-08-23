"use client";

import {
  ScheduleInstance,
  Course,
  User,
  Room,
  Section,
  Batch,
  Program,
  AvailabilityTemplate, // Import AvailabilityTemplate
} from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoursesAssignmentTab } from "./courses-assignment-tab";
import { PersonnelAssignmentTab } from "./personnel-assignment-tab";
import { RoomsAssignmentTab } from "./rooms-assignment-tab";
import { AttendeesAssignmentTab } from "./attendees-assignment-tab";
import { PreviewTab } from "./preview-assignments-tab";

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
    // Include availability template for displaying its name in preview
    availabilityTemplate?: AvailabilityTemplate | null;
  };
  allCourses: Course[];
  allPersonnel: User[];
  allRooms: Room[];
  allSections: SectionWithRelations[];
  availabilityTemplates: AvailabilityTemplate[]; // Add availabilityTemplates prop
}

export function ResourceAssignmentClient({
  scheduleInstance,
  allCourses,
  allPersonnel,
  allRooms,
  allSections,
  availabilityTemplates, // Destructure new prop
}: ResourceAssignmentClientProps) {
  const scheduleInstanceWithRelations = {
    ...scheduleInstance,
    courses: scheduleInstance.courses,
    personnel: scheduleInstance.personnel,
    rooms: scheduleInstance.rooms,
    sections: scheduleInstance.sections as SectionWithRelations[], // assert type or map to include relations
    availabilityTemplate: scheduleInstance.availabilityTemplate ?? null,
  };
  return (
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
          availabilityTemplates={availabilityTemplates} // Pass availabilityTemplates
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
  );
}
