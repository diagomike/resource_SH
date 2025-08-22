"use client";

import { Room, RoomType } from "@prisma/client";
import TanstackEnhancedTable from "@/components/shared/tanstack-enhanced-table"; // Adjusted import path to be relative
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoomsTableProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
}

export function RoomsTable({ rooms, onEdit }: RoomsTableProps) {
  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      searchable: true,
    },
    {
      key: "building",
      label: "Building",
      sortable: true,
      searchable: true,
    },
    {
      key: "capacity",
      label: "Capacity",
      sortable: true,
      searchable: false,
    },
    {
      key: "type",
      label: "Type",
      render: (roomType: RoomType) => {
        return (
          <Badge variant="secondary" className="font-medium">
            {roomType
              .split("_")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}
          </Badge>
        );
      },
      sortable: true,
      searchable: false,
    },
  ];

  const roomTypes = Object.values(RoomType).map((type) => ({
    value: type,
    label: type.replace(/_/g, " "), // Replace all underscores for display
  }));

  const filterOptions = [
    {
      key: "type",
      label: "Type",
      type: "select" as const,
      options: roomTypes,
    },
    {
      key: "capacity",
      label: "Capacity",
      type: "range" as const,
      min: 0,
      max: 500, // Or dynamically calculate the max capacity
    },
  ];

  const actions = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
    },
  ];

  const handleRowAction = (action: string, row: Room) => {
    if (action === "edit") {
      onEdit(row);
    }
  };

  return (
    <TanstackEnhancedTable<Room>
      data={rooms}
      columns={columns}
      filterOptions={filterOptions}
      searchPlaceholder="Search rooms by name or building..."
      emptyMessage="No rooms found."
      actions={actions}
      onRowAction={handleRowAction}
    />
  );
}
