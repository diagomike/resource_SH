// app/admin/timetable/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ScheduleInstance,
  DayOfWeek,
  AvailabilityBlock,
  Room,
  User,
} from "@prisma/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays } from "lucide-react";
import {
  getAllScheduleInstances,
  getTimetableDetails,
  getScheduledEventsForTimeSlot,
  getFreeResourcesForTimeSlot,
  getScheduleInstanceOverviewStatuses, // For header overview
} from "@/lib/actions"; // Assuming these are now available
import {
  FullScheduleInstance,
  FullScheduledEvent,
  TimetableStatusOverview,
  ActiveTimeSlot,
  AvailablePersonnel,
  AvailableRoom,
  timeToSlotIndex,
  slotToTime,
  generateTimeSlots,
  orderedDays,
} from "./_components/_utils"; // Import utilities
import { ScheduledEventCard } from "./_components/scheduled-event-card";
import { FreeResourceCard } from "./_components/free-resource-card";
import { Badge } from "@/components/ui/badge";

// Time range for the full timetable grid (e.g., 8 AM to 6 PM)
const MIN_HOUR = 8;
const MAX_HOUR = 18; // Exclusive, so up to 17:30

export default function TimetableManagementPage() {
  const [allScheduleInstances, setAllScheduleInstances] = useState<
    ScheduleInstance[]
  >([]);
  const [selectedScheduleInstanceId, setSelectedScheduleInstanceId] = useState<
    string | null
  >(null);
  const [scheduleInstanceDetails, setScheduleInstanceDetails] =
    useState<FullScheduleInstance | null>(null);
  const [overviewStatuses, setOverviewStatuses] = useState<
    TimetableStatusOverview[]
  >([]);

  const [activeTimeSlot, setActiveTimeSlot] = useState<ActiveTimeSlot>(null);
  const [eventsAtTimeSlot, setEventsAtTimeSlot] = useState<
    FullScheduledEvent[]
  >([]);
  const [freeResourcesAtTimeSlot, setFreeResourcesAtTimeSlot] = useState<{
    availablePersonnel: AvailablePersonnel[];
    availableRooms: AvailableRoom[];
  }>({ availablePersonnel: [], availableRooms: [] });
  const [selectedEventToAssign, setSelectedEventToAssign] =
    useState<FullScheduledEvent | null>(null);

  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);

  // --- Initial Data Load: All Schedule Instances & Statuses ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingSchedules(true);
      const [instancesResult, statusesResult] = await Promise.all([
        getAllScheduleInstances(),
        getScheduleInstanceOverviewStatuses(),
      ]);

      if (instancesResult.success && instancesResult.data) {
        setAllScheduleInstances(instancesResult.data);
        if (instancesResult.data.length > 0) {
          setSelectedScheduleInstanceId(instancesResult.data[0].id); // Auto-select first schedule
        }
      } else {
        toast.error(instancesResult.message || "Failed to load schedules.");
      }

      if (statusesResult.success && statusesResult.data) {
        setOverviewStatuses(statusesResult.data);
      } else {
        toast.error(
          statusesResult.message || "Failed to load schedule statuses."
        );
      }
      setIsLoadingSchedules(false);
    };
    loadInitialData();
  }, []);

  // --- Load Details for Selected Schedule Instance ---
  useEffect(() => {
    const loadScheduleDetails = async () => {
      if (!selectedScheduleInstanceId) {
        setScheduleInstanceDetails(null);
        return;
      }
      setIsLoadingDetails(true);
      const result = await getTimetableDetails(selectedScheduleInstanceId);
      if (result.success && result.data) {
        setScheduleInstanceDetails(
          result.data.scheduleInstance as FullScheduleInstance
        );
      } else {
        toast.error(result.message || "Failed to load schedule details.");
        setScheduleInstanceDetails(null);
      }
      setIsLoadingDetails(false);
    };
    loadScheduleDetails();
  }, [selectedScheduleInstanceId]);

  // --- Load Sidebar Data for Active Time Slot ---
  const loadSidebarData = useCallback(async () => {
    if (!activeTimeSlot || !selectedScheduleInstanceId) {
      setEventsAtTimeSlot([]);
      setFreeResourcesAtTimeSlot({
        availablePersonnel: [],
        availableRooms: [],
      });
      setSelectedEventToAssign(null);
      return;
    }
    setIsSidebarLoading(true);

    const [eventsResult, freeResourcesResult] = await Promise.all([
      getScheduledEventsForTimeSlot({
        scheduleInstanceId: selectedScheduleInstanceId,
        dayOfWeek: activeTimeSlot.dayOfWeek,
        startTime: activeTimeSlot.startTime,
      }),
      getFreeResourcesForTimeSlot({
        dayOfWeek: activeTimeSlot.dayOfWeek,
        startTime: activeTimeSlot.startTime,
        endTime: activeTimeSlot.endTime,
      }),
    ]);

    if (eventsResult.success && eventsResult.data) {
      setEventsAtTimeSlot(eventsResult.data as FullScheduledEvent[]);
    } else {
      toast.error(
        eventsResult.message || "Failed to load events for time slot."
      );
      setEventsAtTimeSlot([]);
    }

    if (freeResourcesResult.success && freeResourcesResult.data) {
      setFreeResourcesAtTimeSlot(freeResourcesResult.data);
    } else {
      toast.error(
        freeResourcesResult.message || "Failed to load free resources."
      );
      setFreeResourcesAtTimeSlot({
        availablePersonnel: [],
        availableRooms: [],
      });
    }
    setIsSidebarLoading(false);
  }, [activeTimeSlot, selectedScheduleInstanceId]);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  // Generate all 30-minute slots for display
  const allDisplayTimeSlots = useMemo(
    () => generateTimeSlots(MIN_HOUR, MAX_HOUR),
    []
  );

  // Determine if a time slot has an event, and its end time
  const getEventInfoForSlot = useCallback(
    (day: DayOfWeek, startTime: string) => {
      if (!scheduleInstanceDetails)
        return { hasEvent: false, eventEndTime: null };
      const event = scheduleInstanceDetails.scheduledEvents.find(
        (e) => e.dayOfWeek === day && e.startTime === startTime
      );
      return { hasEvent: !!event, eventEndTime: event?.endTime || null };
    },
    [scheduleInstanceDetails]
  );

  // Handle updates to a scheduled event (e.g., resource removal)
  const handleScheduledEventUpdate = useCallback(
    (updatedEvent: FullScheduledEvent) => {
      // Refresh the local state of eventsAtTimeSlot
      setEventsAtTimeSlot((prev) =>
        prev.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      // Reload free resources for the same active time slot, as availability might have changed
      loadSidebarData();
      // Also update the main scheduleInstanceDetails to reflect the change in the timetable view
      setScheduleInstanceDetails((prev) => {
        if (!prev) return null;
        const updatedEvents = prev.scheduledEvents.map((e) =>
          e.id === updatedEvent.id ? updatedEvent : e
        );
        return { ...prev, scheduledEvents: updatedEvents };
      });
      // If the event being updated was the one selected for assignment, update it
      if (
        selectedEventToAssign &&
        selectedEventToAssign.id === updatedEvent.id
      ) {
        setSelectedEventToAssign(updatedEvent);
      }
    },
    [loadSidebarData, selectedEventToAssign]
  );

  if (isLoadingSchedules) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p className="text-lg">Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-extrabold mb-8 text-center ">
        Global Timetable Management
      </h1>

      {/* Header: Schedule Selector & Overview */}
      <Card className="mb-8 p-6 shadow-xl rounded-xl bg-muted">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-2xl font-bold flex items-center ">
            <CalendarDays className="mr-3 h-6 w-6" />
            Select Schedule Instance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full md:w-auto">
            <Select
              value={selectedScheduleInstanceId || ""}
              onValueChange={setSelectedScheduleInstanceId}
              disabled={isLoadingDetails}
            >
              <SelectTrigger className="w-full md:max-w-xs rounded-lg shadow-sm hover:border-muted transition-colors">
                <SelectValue placeholder="Select a schedule instance" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {allScheduleInstances.length === 0 && (
                  <div className="p-2 text-sm ">No schedules available.</div>
                )}
                {allScheduleInstances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.name} ({instance.startDate.toLocaleDateString()} -{" "}
                    {instance.endDate.toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Status Overview */}
          <div className="flex-1 w-full md:w-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overviewStatuses.map((status) => (
              <Card
                key={status.id}
                className="p-3 shadow-md rounded-lg text-center "
              >
                <p className="text-sm font-semibold truncate">{status.name}</p>
                <div className="mt-1">
                  {status.status === "COMPLETED" && (
                    <Badge className="text-green-700 px-3 py-1 rounded-full">
                      Completed
                    </Badge>
                  )}
                  {status.status === "SEMI_ALLOCATED" && (
                    <Badge className="text-yellow-700 px-3 py-1 rounded-full">
                      Semi-Allocated ({status.currentlyScheduledEvents}/
                      {status.totalActivitiesToSchedule})
                    </Badge>
                  )}
                  {status.status === "NOT_SCHEDULED" && (
                    <Badge
                      variant="destructive"
                      className="text-red-700 px-3 py-1 rounded-full"
                    >
                      Not Scheduled
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoadingDetails ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-lg text-muted">Loading timetable data...</p>
        </div>
      ) : !scheduleInstanceDetails ? (
        <p className="text-center text-xl text-muted py-20">
          Please select a schedule instance to view its timetable.
        </p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Timetable Grid */}
          <Card className="flex-1 min-w-0 shadow-lg rounded-xl overflow-hidden ">
            <CardHeader className="p-4 bg-muted border-b">
              <CardTitle className="text-xl font-bold text-muted">
                Timetable for {scheduleInstanceDetails.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Click on a time block to view/edit scheduled events and assign
                free resources.
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-muted">
                  {/* Table Header for Time Slots */}
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider sticky left-0 bg-muted z-20 w-28">
                        Day / Time
                      </th>
                      {allDisplayTimeSlots.map((slot) => (
                        <th
                          key={slot.value}
                          className="px-3 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wider min-w-[70px]"
                        >
                          {slot.display}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {/* Table Body for Days and Time Blocks */}
                  <tbody className="divide-y divide-muted">
                    {orderedDays.map((day) => (
                      <tr key={day}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-muted sticky left-0  z-20 w-28 border-r border-muted">
                          {day}
                        </td>
                        {allDisplayTimeSlots.map((slot) => {
                          const availabilityBlock =
                            scheduleInstanceDetails.availabilityTemplate.availableSlots.find(
                              (block) =>
                                block.dayOfWeek === day &&
                                timeToSlotIndex(slot.value) >=
                                  timeToSlotIndex(block.startTime) &&
                                timeToSlotIndex(slot.value) <
                                  timeToSlotIndex(block.endTime)
                            );
                          const isAvailableTime = !!availabilityBlock;
                          const { hasEvent, eventEndTime } =
                            getEventInfoForSlot(day, slot.value);

                          let cellClasses =
                            "h-12 px-2 py-1 border border-muted cursor-pointer text-center text-xs relative overflow-hidden";
                          if (!isAvailableTime) {
                            cellClasses +=
                              " bg-muted text-muted opacity-60 pointer-events-none";
                          } else if (hasEvent) {
                            cellClasses +=
                              " bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold";
                          } else {
                            cellClasses += "  hover:bg-muted text-muted";
                          }

                          const isActiveSlot =
                            activeTimeSlot?.dayOfWeek === day &&
                            activeTimeSlot.startTime === slot.value;
                          if (isActiveSlot) {
                            cellClasses += " ring-2 ring-blue-500 bg-blue-100";
                          }

                          // Calculate duration in slots
                          const durationSlots = eventEndTime
                            ? timeToSlotIndex(eventEndTime) -
                              timeToSlotIndex(slot.value)
                            : 0;
                          const colSpan = hasEvent
                            ? Math.max(1, durationSlots)
                            : 1;
                          const isStartingEvent = hasEvent; // Only render event details on its start slot

                          return (
                            <td
                              key={`${day}-${slot.value}`}
                              colSpan={colSpan}
                              className={cellClasses}
                              onClick={() =>
                                setActiveTimeSlot({
                                  dayOfWeek: day,
                                  startTime: slot.value,
                                  endTime: slotToTime(
                                    timeToSlotIndex(slot.value) + 1
                                  ), // 30 mins later
                                })
                              }
                            >
                              {isAvailableTime &&
                                (hasEvent ? (
                                  isStartingEvent && (
                                    <div className="absolute inset-0 flex items-center justify-center p-1 text-xs leading-none">
                                      {scheduleInstanceDetails.scheduledEvents
                                        .filter(
                                          (e) =>
                                            e.dayOfWeek === day &&
                                            e.startTime === slot.value
                                        )
                                        .map((e) =>
                                          e.activityTemplate.title
                                            .split(" ")
                                            .map((word) => word[0])
                                            .join("")
                                        ) // Acronym
                                        .join("/")}
                                    </div>
                                  )
                                ) : (
                                  <span className="text-muted"></span> // Placeholder for empty slot
                                ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Right Section: Sidebars */}
          <div className="flex flex-col lg:w-1/3 gap-6">
            {/* Left Sidebar: Scheduled Events for Selected Time */}
            <Card className="shadow-lg rounded-xl min-h-[300px] ">
              <CardHeader className="p-4 bg-muted border-b">
                <CardTitle className="text-lg font-bold text-muted">
                  Events at{" "}
                  {activeTimeSlot
                    ? `${activeTimeSlot.dayOfWeek}, ${activeTimeSlot.startTime}`
                    : "Selected Slot"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 max-h-[calc(50vh-100px)] overflow-y-auto">
                {isSidebarLoading ? (
                  <div className="flex items-center justify-center py-8 text-indigo-600">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Loading events...
                  </div>
                ) : eventsAtTimeSlot.length > 0 ? (
                  eventsAtTimeSlot.map((event) => (
                    <ScheduledEventCard
                      key={event.id}
                      event={event}
                      onEventUpdate={handleScheduledEventUpdate}
                      selectedEventToAssign={selectedEventToAssign}
                      onSelectEventToAssign={setSelectedEventToAssign}
                      activeTimeSlot={activeTimeSlot}
                    />
                  ))
                ) : (
                  <p className="text-center text-sm text-muted py-8">
                    No scheduled events starting at this time.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right Sidebar: Free Resources */}
            <Card className="shadow-lg rounded-xl min-h-[300px] ">
              <CardHeader className="p-4 bg-muted border-b">
                <CardTitle className="text-lg font-bold text-muted">
                  Free Resources at{" "}
                  {activeTimeSlot
                    ? `${activeTimeSlot.dayOfWeek}, ${activeTimeSlot.startTime}`
                    : "Selected Slot"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 max-h-[calc(50vh-100px)] overflow-y-auto">
                {isSidebarLoading ? (
                  <div className="flex items-center justify-center py-8 text-indigo-600">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Loading resources...
                  </div>
                ) : (
                  <>
                    <h5 className="font-semibold text-muted">
                      Available Personnel (
                      {freeResourcesAtTimeSlot.availablePersonnel.length})
                    </h5>
                    {freeResourcesAtTimeSlot.availablePersonnel.length > 0 ? (
                      <div className="space-y-3">
                        {freeResourcesAtTimeSlot.availablePersonnel.map(
                          (personnel) => (
                            <FreeResourceCard
                              key={personnel.id}
                              resource={personnel}
                              type="personnel"
                              selectedEventToAssign={selectedEventToAssign}
                              onAssignResource={loadSidebarData}
                            />
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">
                        No personnel available.
                      </p>
                    )}

                    <h5 className="font-semibold text-muted pt-4 border-t border-muted">
                      Available Rooms (
                      {freeResourcesAtTimeSlot.availableRooms.length})
                    </h5>
                    {freeResourcesAtTimeSlot.availableRooms.length > 0 ? (
                      <div className="space-y-3">
                        {freeResourcesAtTimeSlot.availableRooms.map((room) => (
                          <FreeResourceCard
                            key={room.id}
                            resource={room}
                            type="room"
                            selectedEventToAssign={selectedEventToAssign}
                            onAssignResource={loadSidebarData}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted">No rooms available.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
