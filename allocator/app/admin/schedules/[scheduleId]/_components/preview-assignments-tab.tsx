"use client";

import {
  ScheduleInstance,
  Course,
  User,
  Room,
  AvailabilityTemplate,
} from "@prisma/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  removeResourceFromSchedule,
  updateScheduleTemplate,
} from "@/lib/actions"; // Import updateScheduleTemplate
import { SectionWithRelations } from "./resource-assignment-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ResourceType = "course" | "personnel" | "room" | "section";

interface PreviewTabProps {
  scheduleInstance: ScheduleInstance & {
    courses: Course[];
    personnel: User[];
    rooms: Room[];
    sections: SectionWithRelations[];
    // Ensure availabilityTemplate is included if it's eagerly loaded
    availabilityTemplate?: AvailabilityTemplate | null;
  };
  availabilityTemplates: AvailabilityTemplate[]; // Add availabilityTemplates to props
}

export function PreviewTab({
  scheduleInstance,
  availabilityTemplates,
}: PreviewTabProps) {
  const handleRemove = async (
    resourceId: string,
    resourceType: ResourceType
  ) => {
    const result = await removeResourceFromSchedule({
      scheduleInstanceId: scheduleInstance.id,
      resourceId,
      resourceType,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleTemplateChange = async (newTemplateId: string) => {
    const result = await updateScheduleTemplate({
      scheduleInstanceId: scheduleInstance.id,
      availabilityTemplateId: newTemplateId,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // A generic component to render a list of resources with remove functionality
  const ResourceList = ({ title, items, renderItem, type }: any) => (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item: any) => (
            <li
              key={item.id}
              className="flex items-center justify-between p-2 border rounded-md bg-muted"
            >
              <div>{renderItem(item)}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(item.id, type)}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} assigned.
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Resources Preview</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1">
        {/* Availability Template Selector */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Availability Template</h3>
          <Select
            onValueChange={handleTemplateChange}
            defaultValue={scheduleInstance.availabilityTemplateId || ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a weekly schedule template" />
            </SelectTrigger>
            <SelectContent>
              {availabilityTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            This defines the days and times when events can be scheduled.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ResourceList
            title="Courses"
            items={scheduleInstance.courses}
            type="course"
            renderItem={(item: Course) => (
              <>
                <span className="font-medium">{item.code}</span> - {item.title}
              </>
            )}
          />
          <ResourceList
            title="Personnel"
            items={scheduleInstance.personnel}
            type="personnel"
            renderItem={(item: User) => (
              <>
                <span className="font-medium">{item.name}</span>
                <div className="flex gap-1 mt-1">
                  {item.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          />
          <ResourceList
            title="Rooms"
            items={scheduleInstance.rooms}
            type="room"
            renderItem={(item: Room) => (
              <>
                <span className="font-medium">{item.name}</span> (
                {item.building})
                <div className="text-sm text-muted-foreground">
                  Type: {item.type}, Capacity: {item.capacity}
                </div>
              </>
            )}
          />
          <ResourceList
            title="Attendees (Sections)"
            items={scheduleInstance.sections}
            type="section"
            renderItem={(item: SectionWithRelations) => (
              <>
                <span className="font-medium">{item.name}</span>
                <div className="text-sm text-muted-foreground">
                  {item.batch.program.name} - {item.batch.name}
                </div>
              </>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
