"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  exportAllocationData,
  importAllocationSolution,
  triggerAllocation,
  getScheduleInstanceById, // Import to fetch current settings
  updateScheduleSolverSettings, // NEW: Import the action to save settings
} from "@/lib/actions";
import { Loader2, Zap, Download, Upload } from "lucide-react";
import { z } from "zod";
import { SpacingPreference } from "@prisma/client";
import { liveAllocationFormSchema } from "@/lib/schemas";

type AllocationModalProps = {
  scheduleInstanceId: string;
  onClose: () => void;
};

// Simple client-side utility to trigger a file download
const downloadJson = (data: any, filename: string) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const link = document.createElement("a");
  link.href = jsonString;
  link.download = filename;
  link.click();
};

export function AllocationModal({
  scheduleInstanceId,
  onClose,
}: AllocationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize form with default values (which will be overwritten by fetched data)
  const form = useForm<z.infer<typeof liveAllocationFormSchema>>({
    resolver: zodResolver(liveAllocationFormSchema),
    defaultValues: {
      roomStickinessWeight: 0,

      spacingPreference: SpacingPreference.NONE,
    },
  });

  useEffect(() => {
    const fetchCurrentSolverSettings = async () => {
      setInitialLoading(true);
      const scheduleInstance = await getScheduleInstanceById(
        scheduleInstanceId
      );
      if (scheduleInstance) {
        form.reset({
          roomStickinessWeight: scheduleInstance.roomStickinessWeight ?? 0,
          spacingPreference:
            scheduleInstance.spacingPreference ?? SpacingPreference.NONE,
        });
      }
      setInitialLoading(false);
    };

    fetchCurrentSolverSettings();
  }, [scheduleInstanceId, form]);

  const handleLiveAllocation = async (
    data: z.infer<typeof liveAllocationFormSchema>
  ) => {
    setIsLoading(true);
    toast.info(
      "Saving solver settings and starting allocation. This may take several minutes..."
    );

    // 1. Save the preferences to the database first
    const saveSettingsResult = await updateScheduleSolverSettings({
      scheduleInstanceId: scheduleInstanceId,
      roomStickinessWeight: data.roomStickinessWeight,
      spacingPreference: data.spacingPreference,
    });

    if (!saveSettingsResult.success) {
      toast.error(saveSettingsResult.message);
      setIsLoading(false);
      return;
    }
    toast.success("Solver settings saved.");

    // 2. Trigger the allocation, which will now read settings from the database
    const result = await triggerAllocation(scheduleInstanceId);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  const handleExport = async () => {
    setIsLoading(true);
    const result = await exportAllocationData(scheduleInstanceId);
    if (result.success) {
      downloadJson(result.data, `schedule-data-${scheduleInstanceId}.json`);
      toast.success("Schedule data exported!");
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const solution = JSON.parse(e.target?.result as string);
        const result = await importAllocationSolution({
          scheduleInstanceId,
          solution,
        });
        if (result.success) {
          toast.success(result.message);
          onClose();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Invalid JSON file.");
      } finally {
        setIsLoading(false);
        // Clear the file input after processing
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Run Allocation</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="live">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">Live Allocation</TabsTrigger>
          <TabsTrigger value="manual">Manual / Colab</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="pt-4">
          {initialLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <p>Loading solver settings...</p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleLiveAllocation)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="roomStickinessWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Stickiness Weight</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 50"
                            {...field}
                            value={field.value ?? ""} // Ensure controlled component
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                              )
                            }
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="spacingPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Spacing</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? SpacingPreference.NONE}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a spacing preference" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SpacingPreference).map((pref) => (
                              <SelectItem key={pref} value={pref}>
                                {pref.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Time Preferences are handled by managing ScheduleTimePreference records directly.
                    This modal currently doesn't provide UI to add/edit individual time preferences.
                    They are fetched as part of the schedule instance if they exist. */}
                <p className="text-sm text-muted-foreground">
                  Time preferences are configured separately for the schedule
                  instance.
                </p>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Run Live Allocation
                </Button>
              </form>
            </Form>
          )}
        </TabsContent>
        <TabsContent value="manual" className="pt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Export the schedule data, run it in the Colab notebook, then import
            the resulting solution file.
          </p>
          <Button
            onClick={handleExport}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            1. Export Schedule Data (.json)
          </Button>
          <a
            href="YOUR_COLAB_NOTEBOOK_LINK" // TODO: Replace with your actual Colab notebook link
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button variant="secondary" className="w-full">
              2. Open Google Colab Notebook
            </Button>
          </a>
          <div className="relative">
            <Button asChild variant="outline" className="w-full">
              <label htmlFor="import-file">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                3. Import Solution (.json)
              </label>
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              disabled={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}
