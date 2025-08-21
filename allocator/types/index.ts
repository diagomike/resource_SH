// lib/types.ts

import {
  Prisma,
  Course,
  ActivityTemplate,
  User,
  Room,
  ScheduleInstance,
  Program,
  Batch,
  Section,
  Group,
  PersonnelPreference,
  ScheduledEvent,
} from "@prisma/client";

// -----------------------------------------------------------------------------
// Type Definitions for Data Queries
//
// These types represent the shape of data returned by our server actions,
// which often include relations (e.g., a Course with its ActivityTemplates).
// We use Prisma.PromiseReturnType<T> to infer the return type of a function.
// -----------------------------------------------------------------------------

// --- Helper to infer Server Action return types ---
// This allows us to get the type of the `data` property from our server actions
type ServerActionData<T extends (...args: any) => any> =
  Prisma.PromiseReturnType<T> extends { data?: infer U } ? U : never;

// --- Full Data Structures from `getAll...` or `get...ById` actions ---

// A Course that includes its array of ActivityTemplates
export type CourseWithTemplates = Course & {
  activityTemplates: ActivityTemplate[];
};

// A Program with its full nested hierarchy of children
export type ProgramWithChildren = Program & {
  batches: (Batch & {
    sections: (Section & {
      groups: Group[];
    })[];
  })[];
};

// A comprehensive type for a single ScheduleInstance dashboard page.
// This includes all pooled resources, preferences, and the final schedule.
export type FullScheduleInstance = ScheduleInstance & {
  courses: CourseWithTemplates[];
  sections: (Section & { batch: Batch & { program: Program } })[];
  personnel: User[];
  rooms: Room[];
  preferences: PersonnelPreference[];
  scheduledEvents: ScheduledEvent[];
};

// -----------------------------------------------------------------------------
// Prop Types for Components
//
// Define the props for our React components based on the data types above.
// -----------------------------------------------------------------------------

export type CourseFormProps = {
  course?: CourseWithTemplates; // Optional for create, required for edit
  onSuccess: () => void;
};

export type CoursesTableProps = {
  courses: CourseWithTemplates[];
};

export type PersonnelFormProps = {
  user?: User;
  onSuccess: () => void;
};

export type PersonnelTableProps = {
  users: User[];
};

export type RoomFormProps = {
  room?: Room;
  onSuccess: () => void;
};

export type RoomsTableProps = {
  rooms: Room[];
};

export type ProgramStructureProps = {
  programs: ProgramWithChildren[];
};

export type SchedulesListProps = {
  schedules: ScheduleInstance[];
};

export type ResourceAssignmentProps = {
  schedule: FullScheduleInstance;
  allCourses: Course[];
  allSections: (Section & { batch: Batch & { program: Program } })[];
  allPersonnel: User[];
  allRooms: Room[];
};

export type PreferenceSorterProps = {
  scheduleInstanceId: string;
  personnelId: string;
  // Get all activities available in this schedule for the user's role
  availableActivities: (ActivityTemplate & { course: Course })[];
  // Get existing preferences to pre-populate the sorter
  existingPreferences: PersonnelPreference[];
};

export type ScheduleCalendarProps = {
  events: ScheduledEvent[];
  // We might also need the full context for displaying details on click
  scheduleContext: FullScheduleInstance;
};
