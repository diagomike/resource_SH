// app/admin/timetable/_components/_utils.ts

import {
  ScheduleInstance,
  AvailabilityTemplate,
  ScheduledEvent,
  ActivityTemplate,
  Room,
  User,
  Section,
  Group,
  Batch,
  Program,
  DayOfWeek,
  Role,
  Course,
} from "@prisma/client";

// =================================================================================
// Types for client-side components
// =================================================================================

// Extend Prisma types for full relations where needed
export type FullScheduleInstance = ScheduleInstance & {
  availabilityTemplate: AvailabilityTemplate;
  scheduledEvents: FullScheduledEvent[];
  courses: Course[]; // For calculating total activities to schedule
  sections: (Section & { batch: Batch & { program: Program } })[]; // For calculating total activities to schedule
};

export type FullScheduledEvent = ScheduledEvent & {
  activityTemplate: ActivityTemplate;
  room: Room | null; // room can be null now
  personnel: User[];
  attendeeSection: (Section & { batch: Batch & { program: Program } }) | null;
  attendeeGroup:
    | (Group & { section: Section & { batch: Batch & { program: Program } } })
    | null;
};

export type TimetableStatusOverview = {
  id: string;
  name: string;
  status: "COMPLETED" | "SEMI_ALLOCATED" | "NOT_SCHEDULED";
  totalActivitiesToSchedule: number;
  currentlyScheduledEvents: number;
};

// Types for free resources
export type AvailablePersonnel = User;
export type AvailableRoom = Room;

// Active time slot definition
export type ActiveTimeSlot = {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
} | null;

// =================================================================================
// Helper functions for time and day conversions
// =================================================================================

/**
 * Converts "HH:MM" time string to a slot index within a 24-hour day (0-47).
 * e.g., "00:00" -> 0, "08:30" -> 17, "23:30" -> 47
 */
export const timeToSlotIndex = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 2 + Math.floor(minutes / 30);
};

/**
 * Converts a slot index back to "HH:MM" time string.
 * e.g., 0 -> "00:00", 17 -> "08:30", 47 -> "23:30"
 */
export const slotToTime = (slotIndex: number): string => {
  const hours = Math.floor(slotIndex / 2);
  const minutes = (slotIndex % 2) * 30;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

/**
 * Generates a list of 30-minute time slots between a start and end time (inclusive of start, exclusive of end).
 */
export const generateTimeSlots = (
  startHour: number,
  endHour: number
): { display: string; value: string }[] => {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      const time = `${hour}:${minute}`;
      slots.push({ display: time, value: time });
    }
  }
  return slots;
};

// Ordered days of the week for consistent display
export const orderedDays: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];
