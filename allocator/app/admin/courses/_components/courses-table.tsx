"use client";

import { useState } from "react"; // Import useState
import { CourseWithTemplates } from "@/types";
import TanstackEnhancedTable from "@/components/shared/tanstack-enhanced-table";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteCourse } from "@/lib/actions";
import { toast } from "sonner";
import {
  // Import AlertDialog components
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CoursesTableProps {
  courses: CourseWithTemplates[];
  onEdit: (course: CourseWithTemplates) => void;
}

export function CoursesTable({ courses, onEdit }: CoursesTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] =
    useState<CourseWithTemplates | null>(null);

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
      render: (templates: any[]) => (
        <Badge variant="secondary" className="px-2 py-1 rounded-full text-xs">
          {templates ? templates.length : 0}
        </Badge>
      ),
      sortable: true,
      searchable: false,
    },
  ];

  const actions = [
    {
      key: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
    },
    {
      key: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 text-red-600" />,
      // variant: "destructive" as const, // Ensure variant is destructive for visual cue
    },
  ];

  const handleRowAction = (action: string, row: CourseWithTemplates) => {
    if (action === "edit") {
      onEdit(row);
    } else if (action === "delete") {
      setCourseToDelete(row);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (courseToDelete) {
      const result = await deleteCourse({ id: courseToDelete.id });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const filterOptions = [
    {
      key: "activityTemplates.length",
      label: "Number of Activities",
      type: "range" as const,
      min: 0,
      max: 20,
    },
  ];

  return (
    <>
      <TanstackEnhancedTable<CourseWithTemplates>
        data={courses}
        columns={columns}
        searchPlaceholder="Search courses by code or title..."
        emptyMessage="No courses found. Add your first course to get started."
        actions={actions}
        onRowAction={handleRowAction}
        filterOptions={filterOptions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course "
              <span className="font-semibold">{courseToDelete?.code}</span>" and
              all its related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCourseToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="hover:bg-red-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
