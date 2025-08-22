"use client";

import { CourseWithTemplates } from "@/types";
import TanstackEnhancedTable from "@/components/shared/tanstack-enhanced-table"; // Adjusted import path to be relative
import { Edit } from "lucide-react"; // Import an icon for the edit action
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported if used in render

interface CoursesTableProps {
  courses: CourseWithTemplates[];
  onEdit: (course: CourseWithTemplates) => void;
}

export function CoursesTable({ courses, onEdit }: CoursesTableProps) {
  const columns = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      searchable: true,
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      searchable: true,
    },
    {
      key: "activityTemplates",
      label: "Activities",
      // Render function to display the count of activities
      render: (templates: any[]) => (
        <Badge variant="secondary" className="px-2 py-1 rounded-full text-xs">
          {templates ? templates.length : 0}
        </Badge>
      ),
      sortable: true,
      searchable: false, // Not typically searchable by templates array directly
    },
  ];

  const actions = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
    },
  ];

  const handleRowAction = (action: string, row: CourseWithTemplates) => {
    if (action === "edit") {
      onEdit(row);
    }
  };

  // Filter options for courses table
  const filterOptions = [
    {
      key: "activityTemplates.length", // Filter by number of activities (requires data mapping)
      label: "Number of Activities",
      type: "range" as const,
      min: 0,
      max: 20, // Example max, adjust as needed
    },
  ];

  return (
    <TanstackEnhancedTable<CourseWithTemplates>
      data={courses}
      columns={columns}
      searchPlaceholder="Search courses by code or title..."
      emptyMessage="No courses found. Add your first course to get started."
      actions={actions}
      onRowAction={handleRowAction}
      filterOptions={filterOptions}
    />
  );
}
