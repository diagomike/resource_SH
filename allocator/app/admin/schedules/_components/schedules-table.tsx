"use client";

import { ScheduleInstance, ScheduleStatus } from "@prisma/client";
import TanstackEnhancedTable from "@/components/shared/tanstack-enhanced-table"; // Adjusted import path to be relative
// import Link from "next/link"; // Not directly used in actions due to programmatic navigation
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SchedulesTableProps {
  schedules: ScheduleInstance[];
}

export function SchedulesTable({ schedules }: SchedulesTableProps) {
  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      searchable: true,
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sortable: true,
      searchable: false,
    },
    {
      key: "endDate",
      label: "End Date",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      sortable: true,
      searchable: false,
    },
    {
      key: "status",
      label: "Status",
      render: (status: ScheduleStatus) => (
        <Badge
          variant={
            status === ScheduleStatus.DRAFT
              ? "outline"
              : status === ScheduleStatus.PREFERENCES_OPEN
              ? "secondary"
              : status === ScheduleStatus.LOCKED
              ? "default"
              : status === ScheduleStatus.COMPLETED
              ? "destructive"
              : "default"
          }
          className="font-medium"
        >
          {status
            .split("_")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")}
        </Badge>
      ),
      sortable: true,
      searchable: false,
    },
  ];

  const statusOptions = Object.values(ScheduleStatus).map((status) => ({
    value: status,
    label: status.replace(/_/g, " "),
  }));

  const filterOptions = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: statusOptions,
    },
  ];

  const actions = [
    {
      key: "manage",
      label: "Manage",
      // No icon here, but you could add one, e.g., <ArrowRight className="h-4 w-4" />
    },
  ];

  const handleRowAction = (action: string, row: ScheduleInstance) => {
    if (action === "manage") {
      // Programmatic navigation for the "Manage" action
      window.location.href = `/admin/schedules/${row.id}`;
    }
  };

  return (
    <TanstackEnhancedTable<ScheduleInstance>
      columns={columns}
      data={schedules}
      filterOptions={filterOptions}
      searchPlaceholder="Filter schedules by name..."
      emptyMessage="No schedules found."
      actions={actions}
      onRowAction={handleRowAction}
    />
  );
}
