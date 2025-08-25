"use client";

import { useState } from "react";
import { AvailabilityTemplate } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { TemplateForm } from "./template-form";
import { TemplatesTable } from "./templates-table";

type AvailabilityClientPageProps = {
  templates: AvailabilityTemplate[];
};

export function AvailabilityClientPage({
  templates,
}: AvailabilityClientPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    AvailabilityTemplate | undefined
  >(undefined);

  const handleEdit = (template: AvailabilityTemplate) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(undefined);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTemplate(undefined);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Availability Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable weekly availability schedules.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Template
        </Button>
      </div>

      <TemplatesTable templates={templates} onEdit={handleEdit} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? `Editing the '${selectedTemplate.name}' template.`
                : "Define the name and weekly time blocks for this template."}
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={selectedTemplate}
            onSuccess={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
