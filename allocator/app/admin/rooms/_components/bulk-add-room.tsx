"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, Trash2, Eye, Check, X } from "lucide-react"; // Import X icon
import { bulkCreateRooms } from "@/lib/actions";
import { Room, RoomType } from "@prisma/client";
import { toast } from "sonner";

interface BulkAddRoomsProps {
  onUpdate: () => void;
}

interface BuildingConfig {
  id: string;
  buildingName: string;
  roomCount: number;
  roomType: RoomType;
  capacity: number;
}

export default function BulkAddRooms({ onUpdate }: BulkAddRoomsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [buildings, setBuildings] = useState<BuildingConfig[]>([
    {
      id: "1",
      buildingName: "",
      roomCount: 1,
      roomType: RoomType.LECTURE_HALL,
      capacity: 30,
    },
  ]);
  const [previewRooms, setPreviewRooms] = useState<Omit<Room, "id">[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const roomTypes = Object.values(RoomType);

  const addBuilding = () => {
    const newBuilding: BuildingConfig = {
      id: Date.now().toString(),
      buildingName: "",
      roomCount: 1,
      roomType: RoomType.LECTURE_HALL,
      capacity: 30,
    };
    setBuildings([...buildings, newBuilding]);
  };

  const removeBuilding = (id: string) => {
    setBuildings(buildings.filter((building) => building.id !== id));
  };

  const updateBuilding = (
    id: string,
    field: keyof BuildingConfig,
    value: string | number | RoomType
  ) => {
    setBuildings(
      buildings.map((building) =>
        building.id === id ? { ...building, [field]: value } : building
      )
    );
  };

  const generatePreview = () => {
    setError("");
    const rooms: Omit<Room, "id">[] = [];

    for (const building of buildings) {
      if (!building.buildingName.trim()) {
        setError("All building names are required");
        return;
      }

      if (building.roomCount < 1) {
        setError("Room count must be at least 1");
        return;
      }

      for (let i = 1; i <= building.roomCount; i++) {
        const roomNumber = i.toString().padStart(3, "0");
        rooms.push({
          name: `${building.buildingName}-${roomNumber}`,
          building: building.buildingName,
          capacity: building.capacity,
          type: building.roomType,
          scheduledInstanceIds: [],
        });
      }
    }

    if (rooms.length === 0) {
      setError("Please configure at least one building with rooms");
      return;
    }

    setPreviewRooms(rooms);
    setShowPreview(true);
  };

  // New function to remove a room from the preview list
  const removePreviewRoom = (roomNameToRemove: string) => {
    setPreviewRooms((prevRooms) =>
      prevRooms.filter((room) => room.name !== roomNameToRemove)
    );
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await bulkCreateRooms(previewRooms);
      if (result?.success) {
        toast.success(result.message);
        onUpdate();
        resetForm();
      } else {
        toast.error(result?.message || "Failed to create rooms.");
      }
    } catch (error) {
      toast.error("Failed to create rooms.");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setBuildings([
      {
        id: "1",
        buildingName: "",
        roomCount: 1,
        roomType: RoomType.LECTURE_HALL,
        capacity: 30,
      },
    ]);
    setPreviewRooms([]);
    setShowPreview(false);
    setIsDialogOpen(false);
    setError("");
  };

  const getTotalRooms = () => {
    return buildings.reduce((sum, building) => sum + building.roomCount, 0);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => resetForm()}>
          <MapPin className="h-4 w-4 mr-2" />
          Bulk Add Rooms
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Rooms</DialogTitle>
          <DialogDescription>
            Create multiple rooms across different buildings
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Building Configurations
              </Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{getTotalRooms()} total rooms</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBuilding}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Building
                </Button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {buildings.map((building, index) => (
                <Card key={building.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Building {index + 1}</h4>
                    {buildings.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBuilding(building.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Building Name */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`building-${building.id}`}
                        className="w-40"
                      >
                        Building Name
                      </Label>
                      <Input
                        id={`building-${building.id}`}
                        value={building.buildingName}
                        onChange={(e) =>
                          updateBuilding(
                            building.id,
                            "buildingName",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Science Block"
                        required
                        className="flex-1"
                      />
                    </div>

                    {/* Number of Rooms */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`count-${building.id}`} className="w-40">
                        Number of Rooms
                      </Label>
                      <Input
                        id={`count-${building.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={building.roomCount}
                        onChange={(e) =>
                          updateBuilding(
                            building.id,
                            "roomCount",
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        className="flex-1"
                      />
                    </div>

                    {/* Default Room Type */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`type-${building.id}`} className="w-40">
                        Default Room Type
                      </Label>
                      <Select
                        value={building.roomType}
                        onValueChange={(value) =>
                          updateBuilding(
                            building.id,
                            "roomType",
                            value as RoomType
                          )
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1).toLowerCase()
                                )
                                .join(" ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Default Capacity */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`capacity-${building.id}`}
                        className="w-40"
                      >
                        Default Capacity
                      </Label>
                      <Input
                        id={`capacity-${building.id}`}
                        type="number"
                        min="1"
                        max="500"
                        value={building.capacity}
                        onChange={(e) =>
                          updateBuilding(
                            building.id,
                            "capacity",
                            Number.parseInt(e.target.value) || 30
                          )
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={generatePreview}
                disabled={getTotalRooms() === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Generate Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Generated Rooms</h3>
              <Badge variant="secondary">{previewRooms.length} rooms</Badge>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                {previewRooms.map((room, index) => (
                  <Card key={room.name} className="p-3 relative">
                    {" "}
                    {/* Use room.name as key and add relative positioning */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                      onClick={() => removePreviewRoom(room.name)}
                      aria-label={`Remove room ${room.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1 pr-6">
                      {" "}
                      {/* Add right padding to prevent text overlap with button */}
                      <div className="font-medium text-sm">{room.name}</div>
                      <div className="text-xs text-gray-500">
                        {room.building}
                      </div>
                      <div className="text-xs text-gray-500">
                        {room.type
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() +
                              word.slice(1).toLowerCase()
                          )
                          .join(" ")}
                        • Capacity: {room.capacity}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || previewRooms.length === 0}
              >
                {" "}
                {/* Disable if no rooms to create */}
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Rooms
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
