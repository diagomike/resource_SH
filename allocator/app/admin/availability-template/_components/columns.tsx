"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AvailabilityTemplate, DayOfWeek } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { deleteAvailabilityTemplate } from "@/lib/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const handleDelete = async (id: string) => {
  if (confirm("Are you sure you want to delete this template?")) {
    const result = await deleteAvailabilityTemplate({ id });
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }
};

const dayOrder: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export const getColumns = (
  onEdit: (template: AvailabilityTemplate) => void
): ColumnDef<AvailabilityTemplate>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "availableSlots",
    header: "Available Days",
    cell: ({ row }) => {
      const slots = row.original.availableSlots;
      const uniqueDays = [...new Set(slots.map((slot) => slot.dayOfWeek))];
      const sortedDays = uniqueDays.sort(
        (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
      );

      return (
        <div className="flex flex-wrap gap-1">
          {sortedDays.map((day) => (
            <Badge key={day} variant="secondary">
              {day.substring(0, 3)}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const template = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(template)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(template.id)}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
