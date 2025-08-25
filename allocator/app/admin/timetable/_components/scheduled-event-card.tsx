// app/admin/timetable/_components/ScheduledEventCard.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, UserMinus, Building2 } from "lucide-react";
import {
  FullScheduledEvent,
  ActiveTimeSlot,
  AvailablePersonnel,
  AvailableRoom,
} from "./_utils";
import { toast } from "sonner";
import { updateScheduledEventResources } from "@/lib/actions"; // Assuming this action is available

interface ScheduledEventCardProps {
  event: FullScheduledEvent;
  onEventUpdate: (updatedEvent: FullScheduledEvent) => void;
  selectedEventToAssign: FullScheduledEvent | null;
  onSelectEventToAssign: (event: FullScheduledEvent | null) => void;
  activeTimeSlot: ActiveTimeSlot; // For refreshing data when unassigning
}

export function ScheduledEventCard({
  event,
  onEventUpdate,
  selectedEventToAssign,
  onSelectEventToAssign,
  activeTimeSlot,
}: ScheduledEventCardProps) {
  const handleRemoveRoom = async () => {
    if (!event.roomId) {
      toast.info("No room is assigned to this event.");
      return;
    }
    const result = await updateScheduledEventResources({
      scheduledEventId: event.id,
      roomId: null,
    });
    if (result.success && result.data) {
      toast.success("Room unassigned successfully!");
      onEventUpdate(result.data as FullScheduledEvent);
    } else {
      toast.error(result.message || "Failed to unassign room.");
    }
  };

  const handleRemovePersonnel = async (personnelIdToRemove: string) => {
    const updatedPersonnelIds = event.personnelIds.filter(
      (id) => id !== personnelIdToRemove
    );
    const result = await updateScheduledEventResources({
      scheduledEventId: event.id,
      personnelIds: updatedPersonnelIds,
    });
    if (result.success && result.data) {
      toast.success("Personnel unassigned successfully!");
      onEventUpdate(result.data as FullScheduledEvent);
    } else {
      toast.error(result.message || "Failed to unassign personnel.");
    }
  };

  const handleRemoveAllPersonnel = async () => {
    if (event.personnelIds.length === 0) {
      toast.info("No personnel assigned to this event.");
      return;
    }
    const result = await updateScheduledEventResources({
      scheduledEventId: event.id,
      personnelIds: [],
    });
    if (result.success && result.data) {
      toast.success("All personnel unassigned successfully!");
      onEventUpdate(result.data as FullScheduledEvent);
    } else {
      toast.error(result.message || "Failed to unassign all personnel.");
    }
  };

  const isSelectedForAssignment = selectedEventToAssign?.id === event.id;

  return (
    <Card
      className={`relative p-3 shadow-sm rounded-lg border-2 ${
        isSelectedForAssignment
          ? "border-primary ring-2 ring-primary/50"
          : "border-gray-200"
      }`}
    >
      <CardContent className="p-0 space-y-2">
        <h4 className="font-semibold text-base">
          {event.activityTemplate.title}
        </h4>
        <p className="text-sm text-muted-foreground">
          {event.attendeeSection?.name || event.attendeeGroup?.name} (
          {event.attendeeSection?.batch.name ||
            event.attendeeGroup?.section.batch.name}
          )
        </p>

        {/* Room Assignment */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 text-gray-500" />
          {event.room ? (
            <span className="flex-grow">
              {event.room.name} ({event.room.type})
            </span>
          ) : (
            <span className="italic text-gray-500 flex-grow">
              No Room Assigned
            </span>
          )}
          {event.room && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveRoom}
              aria-label="Remove room"
              className="px-2"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>

        {/* Personnel Assignment */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <UserMinus className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Personnel:</span>
            </div>
            {event.personnel.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAllPersonnel}
                aria-label="Remove all personnel"
                className="px-2 text-red-500 hover:text-red-700"
              >
                Remove All
              </Button>
            )}
          </div>
          {event.personnel.length > 0 ? (
            <ul className="space-y-1 ml-2">
              {event.personnel.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {p.name} ({p.roles.join(", ")})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePersonnel(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="px-2"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="italic text-gray-500 ml-2 text-sm">
              No Personnel Assigned
            </p>
          )}
        </div>
        <Button
          onClick={() =>
            onSelectEventToAssign(isSelectedForAssignment ? null : event)
          }
          variant={isSelectedForAssignment ? "default" : "outline"}
          size="sm"
          className="w-full mt-3"
        >
          {isSelectedForAssignment ? "Selected" : "Select to Assign"}
        </Button>
      </CardContent>
    </Card>
  );
}
