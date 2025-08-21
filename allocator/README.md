Excellent work\! Completing the foundational resource management is a huge milestone. You've now built the "inventory" of your university. The next logical step is to create the "context" for allocation—the schedules and the groups of people who will participate in them.

This next phase is about bringing all the pieces together. We will build it in three sequential stages:

1.  **Stage 1: Manage Attendee Structures**: Create the UI to define the academic hierarchy (Programs → Batches → Sections → Groups). We need to know *who* the attendees are before we can assign them to anything.
2.  **Stage 2: Manage Schedule Instances**: Create the UI to define the scheduling periods (e.g., "Fall 2025 Semester"). These are the containers for your timetables.
3.  **Stage 3: The Schedule Dashboard**: Build the main page for a single schedule instance where an administrator can assign the Courses, Personnel, and Rooms that you've already created. This is the core administrative task.

Let's proceed with Stage 1.

-----

### Stage 1: Manage Attendee Structures (`/admin/programs`)

This section is different from the others. Instead of a simple table, a nested, collapsible view is much more intuitive for managing a hierarchy. We'll build a single page where you can see and manage everything from Programs down to Groups.

#### 1\. File Structure for `/admin/programs`

Create these new files:

  * `app/admin/programs/page.tsx`
  * `app/admin/programs/_components/program-structure-client.tsx`
  * `app/admin/programs/_components/program-form.tsx`
  * `app/admin/programs/_components/batch-form.tsx`
  * `app/admin/programs/_components/section-form.tsx`


#### 2\. The Main Page (Server Component)

This page fetches the nested data and passes it to the interactive client component.

**File:** `app/admin/programs/page.tsx`

```tsx
import { getProgramsWithChildren } from "@/lib/actions";
import { ProgramStructureClient } from "./_components/program-structure-client";

export default async function ProgramsPage() {
  const programs = await getProgramsWithChildren();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Academic Structure</h1>
      </div>
      <ProgramStructureClient programs={programs} />
    </div>
  );
}
```

#### 4\. The Interactive Client Component

This component will render the nested structure and handle the state for opening forms in dialogs. We'll use `shadcn/ui`'s `Collapsible` component to make it interactive.

**File:** `app/admin/programs/_components/program-structure-client.tsx`

```tsx
"use client";

import { useState } from "react";
import { ProgramWithChildren } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, PlusCircle } from "lucide-react";
import { ProgramForm } from "./program-form";
import { BatchForm } from "./batch-form";
import { SectionForm } from "./section-form";

// Define a type for the dialog state
type DialogState = 
  | { type: 'program'; data?: ProgramWithChildren }
  | { type: 'batch'; data?: { programId: string } }
  | { type: 'section'; data?: { batchId: string } }
  | null;

export function ProgramStructureClient({ programs: initialPrograms }: { programs: ProgramWithChildren[] }) {
  const [dialogState, setDialogState] = useState<DialogState>(null);

  // We'll manage the state locally to avoid a full page refresh on create/edit
  const [programs, setPrograms] = useState(initialPrograms);

  const handleSuccess = () => {
    // In a real app, you would ideally refetch the data or update the state smartly.
    // For now, we just close the dialog. A page refresh will show the new data.
    setDialogState(null);
  };

  const renderDialogContent = () => {
    if (!dialogState) return null;

    switch (dialogState.type) {
      case 'program':
        return <ProgramForm program={dialogState.data} onSuccess={handleSuccess} />;
      case 'batch':
        return <BatchForm programId={dialogState.data?.programId!} onSuccess={handleSuccess} />;
      case 'section':
        return <SectionForm batchId={dialogState.data?.batchId!} onSuccess={handleSuccess} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 border rounded-md">
        <div className="flex justify-end mb-4">
            <Button onClick={() => setDialogState({ type: 'program' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Program
            </Button>
        </div>
        <div className="space-y-2">
          {programs.map((program) => (
            <Collapsible key={program.id} className="group">
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center flex-1 cursor-pointer">
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    <span className="font-semibold ml-2">{program.name}</span>
                  </div>
                </CollapsibleTrigger>
                <Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'batch', data: { programId: program.id } })}>Add Batch</Button>
              </div>
              <CollapsibleContent className="pl-6 border-l ml-4">
                {program.batches.map((batch) => (
                  <Collapsible key={batch.id} className="group">
                     <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center flex-1 cursor-pointer">
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                                <span className="ml-2">{batch.name}</span>
                            </div>
                        </CollapsibleTrigger>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ type: 'section', data: { batchId: batch.id } })}>Add Section</Button>
                    </div>
                    <CollapsibleContent className="pl-6 border-l ml-4">
                       {batch.sections.map((section) => (
                         <div key={section.id} className="p-2">
                           <span>- {section.name}</span>
                           {/* Add Group button/logic would go here */}
                         </div>
                       ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
      
      <Dialog open={!!dialogState} onOpenChange={(isOpen) => !isOpen && setDialogState(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {dialogState?.type === 'program' && 'Add/Edit Program'}
                    {dialogState?.type === 'batch' && 'Add Batch'}
                    {dialogState?.type === 'section' && 'Add Section'}
                </DialogTitle>
            </DialogHeader>
            {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Note:** The forms (`program-form.tsx`, etc.) would be very simple, following the same pattern as `course-form.tsx` but with just one or two fields. You would create them and import them as shown.

-----

### How to Proceed from Here

1.  **Implement Stage 1 Fully**:

      * Create the simple form components (`ProgramForm`, `BatchForm`, `SectionForm`) that the client component expects. They will each call their respective `create...` server action.


