# Project Upgrade: Multi-Tenant University Scheduler

## 1. Overview

This document outlines the major architectural upgrade for the University Scheduler application. The goal is to evolve the current single-instance system into a multi-tenant platform capable of serving multiple distinct colleges within a university.

Each college will have its own designated administrators who can manage their own resources (Courses, Personnel, Rooms, etc.) and generate timetables independently. A SuperAdmin role will oversee the entire platform, manage colleges, and have global visibility.

This upgrade also introduces advanced scheduling capabilities, including more sophisticated solver constraints and a new interactive, manual timetabling UI, providing administrators with unprecedented flexibility and control.

## 2. Key Features in this Upgrade

1.  **Multi-Tenancy with College Scoping**:
    * Introduction of `College`, `SuperAdmin`, and `CollegeAdmin` roles.
    * All core resources (Courses, Personnel, Rooms, Programs) will be scoped to a specific College.
    * Robust authorization will ensure College Admins can only access their own resources.

2.  **Advanced Solver & Data Integration**:
    * **Timeslot Preferences**: A new UI for administrators to rank preferred days and times, influencing the solver's output.
    * **Historical Records**: The system will now track historical personnel-course assignments.
    * **AI-Powered Preference**: The allocation algorithm will use historical data as a soft constraint, favoring assigning personnel to courses they have taught before.

3.  **Three Modes of Timetable Allocation**:
    * **Python Solver (Live)**: The existing method, enhanced with new constraints.
    * **Colab / Manual Export-Import**: An offline method for running the solver using a provided Colab notebook.
    * **Interactive UI Solver**: A brand-new, visual timetabling tool for manual drag-and-drop assignments with real-time conflict checking and a simplified "quick solve" option.

## 3. Core Architectural Changes

The cornerstone of this upgrade is the introduction of the `College` entity. This requires a significant refactor of our database schema and server actions.

* **Schema**: A `collegeId` field will be added to `User`, `Course`, `Room`, `Program`, `ScheduleInstance`, and other relevant models. The `User` model will also gain a `role` field (`SUPER_ADMIN`, `COLLEGE_ADMIN`).
* **Authorization**: Every server action must be updated to include authorization checks. Data fetching will be filtered by the logged-in user's `collegeId`, while a `SUPER_ADMIN` will have unrestricted access. This ensures strict data isolation between colleges.

---

## 4. Optimized Todolist for Development

This Todolist is structured to tackle foundational changes first, ensuring a smooth and logical progression for the team.

### **Phase 1: Foundational Multi-Tenancy (Blocking Tasks)**
*(This phase must be completed before others can begin. It affects the entire application.)*

* [ ] **Task 1.1: Database Schema Overhaul**
    * [ ] Create a new `College` model in `schema.prisma`.
    * [ ] Add a `role` enum (`SUPER_ADMIN`, `COLLEGE_ADMIN`) and an optional `collegeId` relation to the `User` model.
    * [ ] Add a required `collegeId` relation to `Course`, `Room`, `Program`, `AvailabilityTemplate`, and `ScheduleInstance` models.
    * [ ] Run `prisma db push` to apply schema changes.

* [ ] **Task 1.2: Implement Core Authorization Logic**
    * [ ] Create a helper function (e.g., in `lib/auth.ts`) to get the current user's session, role, and `collegeId`.
    * [ ] Update **all existing server actions** (`lib/actions.ts`) to perform authorization checks at the beginning of each function.
        * _Note: Creation actions must assign the admin's `collegeId`. Fetching actions must filter by `collegeId`. Update/Delete actions must verify ownership._

* [ ] **Task 1.3: SuperAdmin UI for College Management**
    * [ ] Create a new admin page: `/admin/colleges`.
    * [ ] Build the UI (table, forms) for the SuperAdmin to Create, Read, Update, and Delete `College`s.
    * [ ] Modify the `/admin/personnel` page so a SuperAdmin can create new users and assign them the `COLLEGE_ADMIN` role along with a specific `College`.

* [ ] **Task 1.4: Adapt Existing Admin UI for College Admins**
    * [ ] Ensure all data tables (for courses, rooms, etc.) now correctly display only the data associated with the logged-in College Admin.
    * [ ] The "Create New" forms should automatically associate new resources with the admin's college.

### **Phase 2: Advanced Data & Solver Integration**

* [ ] **Task 2.1: Implement Historical Records**
    * [ ] Create a new `SchedulingRecord` model in `schema.prisma` to store `personnelId`, `courseId`, `scheduleInstanceId`, and `collegeId`.
    * [ ] Update the `saveSolutionToDatabase` function to automatically create these records after a schedule is `COMPLETED`.
    * [ ] Create a new page `/admin/records` for viewing assignment history, with appropriate filters.

* [ ] **Task 2.2: Implement Timeslot Preference UI**
    * [ ] In the Schedule Dashboard (`/admin/schedules/[scheduleId]`), add a new "Time Preferences" tab.
    * [ ] Design and build a UI within this tab that allows an admin to rank specific start times (e.g., 8:00 AM = Rank 10, 2:00 PM = Rank 8).
    * [ ] Create a new server action to save these preferences, likely associated with the `ScheduleInstance`.

* [ ] **Task 2.3: Update Solver Data Pipeline**
    * [ ] Modify the `getScheduleDataForSolver` action to include historical assignment data and the new timeslot preferences in the JSON payload sent to the Python solver.
    * [ ] Update the Python solver (`solver.py`) to incorporate this new data into its objective function, adding weight for historical assignments and preferred times.

### **Phase 3: Interactive Timetabling Feature**

* [ ] **Task 3.1: Build the Timetable Grid View**
    * [ ] In the Schedule Dashboard, create a new "Interactive" allocation tab.
    * [ ] Develop a calendar/grid component (`interactive-timetable.tsx`) that displays the schedule's available days and timeslots as a grid.
    * [ ] This grid should display any activities that have been manually placed.

* [ ] **Task 3.2: Develop the Contextual Sidebar**
    * [ ] Create a sidebar component that appears when a user clicks on a timeslot in the grid.
    * [ ] The sidebar should have tabs: "Unscheduled Activities", "Available Personnel", "Available Rooms".
    * [ ] Implement the server actions needed to fetch this contextual data (e.g., `getAvailableResourcesAtTime(timeSlot, scheduleId)`).

* [ ] **Task 3.3: Implement Manual Assignment Logic**
    * [ ] Add drag-and-drop functionality from the sidebar to the timetable grid.
    * [ ] Implement the client-side state logic and server actions to create/update `ScheduledEvent` records for these manual placements.
    * [ ] Add real-time conflict checking (e.g., if a room is assigned, it should be removed from the "Available Rooms" list for that slot).

* [ ] **Task 3.4 (Stretch Goal): Implement Simplified "Quick Solve"**
    * [ ] Add a "Quick Solve" button to the interactive timetabler.
    * [ ] Implement a new, fast server action that runs a simplified allocation (e.g., a greedy algorithm) considering only the most important constraints and preferences, and then updates the UI.

### **Phase 4: Final Polish & Review**

* [ ] **Task 4.1: Code Review and Refactoring**
    * [ ] Review all new server actions for security and efficiency.
    * [ ] Ensure consistent error handling and user feedback (toasts/notifications) across all new features.
* [ ] **Task 4.2: End-to-End Testing**
    * [ ] Test the complete workflow for a SuperAdmin.
    * [ ] Test the complete workflow for a College Admin, ensuring they cannot access data from other colleges.
    * [ ] Test all three allocation methods.
* [ ] **Task 4.3: Update Documentation**
    * [ ] Document the new roles and permissions.
    * [ ] Document the process for using the interactive timetabler.