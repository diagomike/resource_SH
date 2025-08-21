"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CourseForm } from "./course-form";
import { CoursesTable } from "./courses-table";
import { CourseWithTemplates } from "@/types";
import { PlusCircle } from "lucide-react";

type CoursesClientPageProps = {
  courses: CourseWithTemplates[];
};

export function CoursesClientPage({ courses }: CoursesClientPageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<
    CourseWithTemplates | undefined
  >(undefined);

  const handleOpenDialog = (course?: CourseWithTemplates) => {
    setEditingCourse(course);
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingCourse(undefined);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
        </Button>
      </div>

      <CoursesTable courses={courses} onEdit={handleOpenDialog} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
          </DialogHeader>
          <CourseForm course={editingCourse} onSuccess={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </>
  );
}
