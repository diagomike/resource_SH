// app/admin/timetable/_components/FreeResourceCard.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Building2, Plus } from "lucide-react";
import {
  AvailablePersonnel,
  AvailableRoom,
  FullScheduledEvent,
} from "./_utils";
import { toast } from "sonner";
import { updateScheduledEventResources } from "@/lib/actions"; // Assuming this action is available

interface FreeResourceCardProps {
  resource: AvailablePersonnel | AvailableRoom;
  type: "personnel" | "room";
  selectedEventToAssign: FullScheduledEvent | null;
  onAssignResource: () => void; // Callback to refresh sidebar data
}

export function FreeResourceCard({
  resource,
  type,
  selectedEventToAssign,
  onAssignResource,
}: FreeResourceCardProps) {
  const handleAssign = async () => {
    if (!selectedEventToAssign) {
      toast.error(
        "Please select a scheduled event first to assign this resource."
      );
      return;
    }

    let result;
    if (type === "room") {
      result = await updateScheduledEventResources({
        scheduledEventId: selectedEventToAssign.id,
        roomId: resource.id,
      });
    } else {
      // Assuming resource is AvailablePersonnel (User)
      const currentPersonnelIds = selectedEventToAssign.personnelIds || [];
      const newPersonnelIds = [
        ...new Set([...currentPersonnelIds, resource.id]),
      ]; // Add if not already present
      result = await updateScheduledEventResources({
        scheduledEventId: selectedEventToAssign.id,
        personnelIds: newPersonnelIds,
      });
    }

    if (result?.success) {
      toast.success(
        `${type === "room" ? "Room" : "Personnel"} assigned successfully!`
      );
      onAssignResource(); // Refresh sidebars
    } else {
      toast.error(result?.message || `Failed to assign ${type}.`);
    }
  };

  return (
    <Card className="p-3 shadow-sm rounded-lg border border-gray-200">
      <CardContent className="p-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {type === "personnel" ? (
            <User className="h-5 w-5 text-gray-500" />
          ) : (
            <Building2 className="h-5 w-5 text-gray-500" />
          )}
          <div>
            <h4 className="font-medium">
              {resource.name}
              {type === "room" && ` (${(resource as AvailableRoom).building})`}
            </h4>
            {type === "personnel" && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(resource as AvailablePersonnel).roles.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className="px-2 py-0.5 text-xs"
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            )}
            {type === "room" && (
              <p className="text-sm text-muted-foreground">
                Type: {(resource as AvailableRoom).type}, Cap:{" "}
                {(resource as AvailableRoom).capacity}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAssign}
          disabled={!selectedEventToAssign}
          className="rounded-md"
        >
          <Plus className="h-4 w-4 mr-2" /> Assign
        </Button>
      </CardContent>
    </Card>
  );
}
