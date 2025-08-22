"use client";

import { useState, useEffect } from "react";
import { ActivityTemplate, Course, PersonnelPreference } from "@prisma/client";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitPreferences } from "@/lib/actions";

// Define the shape of the activity object, which includes the course details
type ActivityWithCourse = ActivityTemplate & {
  course: Course;
};

// Define the props for our component
interface PreferenceSorterProps {
  personnelId: string;
  scheduleInstanceId: string;
  availableActivities: ActivityWithCourse[];
  existingPreferences: PersonnelPreference[];
}

export function PreferenceSorterClient({
  personnelId,
  scheduleInstanceId,
  availableActivities,
  existingPreferences,
}: PreferenceSorterProps) {
  const [ranked, setRanked] = useState<ActivityWithCourse[]>([]);
  const [unranked, setUnranked] = useState<ActivityWithCourse[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Initialize the ranked and unranked lists when the component mounts
  useEffect(() => {
    const rankedIds = new Set(
      existingPreferences.map((p) => p.activityTemplateId)
    );
    const sortedRanked = [...existingPreferences]
      .sort((a, b) => a.rank - b.rank)
      .map(
        (p) => availableActivities.find((a) => a.id === p.activityTemplateId)!
      )
      .filter(Boolean); // Filter out any potential undefined values

    const initialUnranked = availableActivities.filter(
      (a) => !rankedIds.has(a.id)
    );

    setRanked(sortedRanked);
    setUnranked(initialUnranked);
  }, [availableActivities, existingPreferences]);

  // --- Drag and Drop Handlers ---

  // Handler for drag start on a list item
  const handleDragStart = (
    e: React.DragEvent<HTMLLIElement>,
    item: ActivityWithCourse
  ) => {
    setDraggedItemId(item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handler for drag over on a list item
  const handleDragOverForLi = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  // Handler for drag over on a div container
  const handleDragOverForDiv = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  // Handler for dropping on a ranked list item
  const handleDropOnRankedLi = (
    e: React.DragEvent<HTMLLIElement>,
    dropIndex: number
  ) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const draggedItem =
      ranked.find((i) => i.id === draggedItemId) ||
      unranked.find((i) => i.id === draggedItemId);

    if (!draggedItem) return;

    // Remove from both lists
    const newRanked = ranked.filter((i) => i.id !== draggedItemId);
    const newUnranked = unranked.filter((i) => i.id !== draggedItemId);

    // Add to ranked list at the correct position
    newRanked.splice(dropIndex, 0, draggedItem);

    setRanked(newRanked);
    setUnranked(newUnranked);
    setDraggedItemId(null);
  };

  // Handler for dropping on the unranked container
  const handleDropOnUnrankedDiv = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const draggedItem = ranked.find((i) => i.id === draggedItemId);
    if (!draggedItem) return;

    setRanked(ranked.filter((i) => i.id !== draggedItemId));
    setUnranked([...unranked, draggedItem]);
    setDraggedItemId(null);
  };

  // Handler for dropping on the ranked container (at the end of the list)
  const handleDropOnRankedDiv = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedItemId) return;

    const draggedItem =
      ranked.find((i) => i.id === draggedItemId) ||
      unranked.find((i) => i.id === draggedItemId);
    if (!draggedItem) return;

    // Remove from both lists
    const newRanked = ranked.filter((i) => i.id !== draggedItemId);
    const newUnranked = unranked.filter((i) => i.id !== draggedItemId);

    // Add to the end of the ranked list
    newRanked.push(draggedItem);

    setRanked(newRanked);
    setUnranked(newUnranked);
    setDraggedItemId(null);
  };

  // --- Save Handler ---
  const handleSave = async () => {
    setIsSaving(true);
    const preferencesToSave = ranked.map((activity, index) => ({
      activityTemplateId: activity.id,
      rank: index + 1,
    }));

    const result = await submitPreferences({
      personnelId,
      scheduleInstanceId,
      preferences: preferencesToSave,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message || "Failed to save preferences.");
    }
    setIsSaving(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Ranked Activities Column */}
      <Card>
        <CardHeader>
          <CardTitle>Your Ranked Preferences</CardTitle>
        </CardHeader>
        <CardContent
          onDragOver={handleDragOverForDiv} // Use the new handler for div
          onDrop={handleDropOnRankedDiv} // Use the new handler for div
        >
          {ranked.length > 0 ? (
            <ul className="space-y-2">
              {ranked.map((item, index) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOverForLi} // Use the specific handler for li
                  onDrop={(e) => handleDropOnRankedLi(e, index)} // Use the specific handler for li
                  className="flex items-center p-3 border rounded-md cursor-grab bg-muted shadow-sm"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground mr-3" />
                  <div className="flex-grow">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.course.code} - {item.course.title}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-muted">
                    {index + 1}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-md">
              <p>Drag activities here to rank them.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unranked Activities Column */}
      <Card>
        <CardHeader>
          <CardTitle>Available Activities</CardTitle>
        </CardHeader>
        <CardContent
          onDragOver={handleDragOverForDiv} // Use the new handler for div
          onDrop={handleDropOnUnrankedDiv} // Use the new handler for div
          className="space-y-2"
        >
          {unranked.map((item) => (
            <li
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              className="flex items-center p-3 border rounded-md cursor-grab bg-muted shadow-sm"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground mr-3" />
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.course.code} - {item.course.title}
                </p>
              </div>
            </li>
          ))}
          {unranked.length === 0 && (
            <p className="text-sm text-muted-foreground text-center pt-4">
              All activities have been ranked.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="md:col-span-2 flex justify-center mt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
