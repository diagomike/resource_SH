// lib/schemas.ts

import { z } from "zod";
import {
  Role,
  RoomType,
  AttendeeLevel,
  ScheduleStatus,
  DayOfWeek,
} from "@prisma/client";

// ---------------------------------------------------
// 2. Zod Schemas for Validation
// ---------------------------------------------------

export const idSchema = z.object({ id: z.string() });

// --- Course & ActivityTemplate Schemas ---
const requiredPersonnelSchema = z.object({
  role: z.nativeEnum(Role),
  count: z.number().int().min(1),
});

const activityTemplateSchema = z.object({
  title: z.string().min(3),
  durationMinutes: z.number().int().positive(),
  attendeeLevel: z.nativeEnum(AttendeeLevel),
  requiredRoomType: z.nativeEnum(RoomType),
  requiredPersonnel: z.array(requiredPersonnelSchema).min(1),
});

export const createCourseSchema = z.object({
  code: z.string().min(3),
  title: z.string().min(3),
  activityTemplates: z.array(activityTemplateSchema).min(1),
});

export const updateCourseSchema = z.object({
  id: z.string(),
  code: z.string().min(3),
  title: z.string().min(3),
});

// --- User (Personnel) Schema ---
export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  roles: z.array(z.nativeEnum(Role)).min(1),
});

export const updateUserSchema = userSchema.extend({
  id: z.string(),
});

// --- Room Schema ---
export const roomSchema = z.object({
  name: z.string().min(3),
  building: z.string().min(2),
  capacity: z.number().int().positive(),
  type: z.nativeEnum(RoomType),
});

export const updateRoomSchema = roomSchema.extend({
  id: z.string(),
});

// --- Attendee Structure Schemas (Single Creation) ---
export const programSchema = z.object({ name: z.string().min(5) });
export const batchSchema = z.object({
  name: z.string().min(3),
  programId: z.string(),
});
export const sectionSchema = z.object({
  name: z.string().min(1),
  batchId: z.string(),
});
export const groupSchema = z.object({
  name: z.string().min(1),
  sectionId: z.string(),
});

// --- Schemas for Bulk Program/Sub-level Creation ---

// For the main bulk program creator
const bulkGroupSchema = z.object({
  name: z.string().min(1, "Group name is required."),
});

const bulkSectionSchema = z.object({
  name: z.string().min(1, "Section name is required."),
  groups: z
    .array(bulkGroupSchema)
    .min(1, "At least one group is required per section."),
});

const bulkBatchSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters."),
  sections: z
    .array(bulkSectionSchema)
    .min(1, "At least one section is required per batch."),
});

export const bulkProgramSchema = z.object({
  name: z.string().min(5, "Program name must be at least 5 characters."),
  batches: z.array(bulkBatchSchema).min(1, "At least one batch is required."),
});

// For creating multiple groups under one section
export const bulkCreateGroupsSchema = z.object({
  sectionId: z.string(),
  groups: z
    .array(z.object({ name: z.string().min(1, "Group name is required.") }))
    .min(1, "At least one group is required."),
});

// For creating one section with optional multiple groups
export const createSectionWithGroupsSchema = z.object({
  batchId: z.string(),
  name: z.string().min(1, "Section name is required."),
  groups: z
    .array(z.object({ name: z.string().min(1, "Group name is required.") }))
    .optional(), // Groups are optional
});

// For creating one batch with optional multiple sections (and their groups)
export const createBatchWithSectionsSchema = z.object({
  programId: z.string(),
  name: z.string().min(3, "Batch name must be at least 3 characters."),
  sections: z
    .array(
      z.object({
        name: z.string().min(1, "Section name is required."),
        groups: z
          .array(
            z.object({ name: z.string().min(1, "Group name is required.") })
          )
          .min(1, "At least one group is required per section."),
      })
    )
    .optional(), // Sections are optional
});

// --- AvailabilityTemplate Schema (NEW) ---
export const availabilityTemplateSchema = z
  .object({
    id: z.string().optional(), // For updates
    name: z.string().min(3, "Template name must be at least 3 characters."),
    availableSlots: z
      .array(
        z.object({
          dayOfWeek: z.enum(DayOfWeek),
          startTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/, "Invalid start time format (HH:MM)."),
          endTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/, "Invalid end time format (HH:MM)."),
        })
      )
      .min(1, "At least one time block is required."),
  })
  .refine(
    (data) => {
      // Ensure for each slot, endTime is after startTime
      return data.availableSlots.every((slot) => slot.endTime > slot.startTime);
    },
    {
      message: "End time must be after start time for all time blocks.",
      path: ["availableSlots"], // You can specify a path to show the error
    }
  );

// --- ScheduleInstance Schema (UPDATED) ---
export const createScheduleInstanceSchema = z.object({
  name: z.string().min(5),
  startDate: z.date(),
  endDate: z.date(),
  // ADD THIS LINE
  availabilityTemplateId: z
    .string()
    .min(1, "An availability template is required."),
});

export const updateScheduleInstanceSchema = createScheduleInstanceSchema.extend(
  {
    id: z.string(),
  }
);

export const updateScheduleTemplateSchema = z.object({
  scheduleInstanceId: z.string(),
  availabilityTemplateId: z.string().min(1, "A template must be selected."),
});

export const assignResourcesSchema = z.object({
  scheduleInstanceId: z.string(),
  courseIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  personnelIds: z.array(z.string()).optional(),
  roomIds: z.array(z.string()).optional(),
});

/**
 * It requires the schedule ID, the ID of the resource to remove,
 * and the type of the resource to identify the correct database relation.
 */
export const removeResourceSchema = z.object({
  scheduleInstanceId: z.string(),
  resourceId: z.string(),
  resourceType: z.enum(["course", "personnel", "room", "section"]),
});

// --- PersonnelPreference Schema ---
export const preferencesSchema = z.object({
  personnelId: z.string(),
  scheduleInstanceId: z.string(),
  preferences: z.array(
    z.object({
      activityTemplateId: z.string(),
      rank: z.number().int().positive(),
    })
  ),
});
