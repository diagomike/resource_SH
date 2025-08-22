"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { ScheduleInstance, User } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { assignResourcesToSchedule } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link2, // Import the Link2 icon
  Mail, // Import Mail icon for emailing
  Download, // Import Download icon for export
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import the new server action for emailing
import { sendPreferenceEmail } from "@/lib/emailActions";

// The User type from Prisma will now include the preferenceToken
type UserWithToken = User & { preferenceToken: string | null };

interface PersonnelAssignmentTabProps {
  scheduleInstance: ScheduleInstance & { personnel: UserWithToken[] };
  allPersonnel: UserWithToken[];
}

export function PersonnelAssignmentTab({
  scheduleInstance,
  allPersonnel,
}: PersonnelAssignmentTabProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
    () => {
      const initialSelection: Record<string, boolean> = {};
      for (const user of scheduleInstance.personnel) {
        const rowIndex = allPersonnel.findIndex((p) => p.id === user.id);
        if (rowIndex !== -1) {
          initialSelection[rowIndex] = true;
        }
      }
      return initialSelection;
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // New state for export loading
  const [isSendingEmails, setIsSendingEmails] = useState(false); // New state for email loading
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Function to handle copying the preference link
  const handleCopyLink = (token: string | null) => {
    if (!token) {
      toast.error("This user does not have a preference token.");
      return;
    }
    const url = `${window.location.origin}/preferences/${scheduleInstance.id}?token=${token}`;
    // Using document.execCommand('copy') for better iframe compatibility
    try {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("Preference link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link.");
      console.error("Could not copy text: ", err);
    }
  };

  const columns: ColumnDef<UserWithToken>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.getValue("email"),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {(row.getValue("roles") as string[]).map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const roles = row.getValue(columnId) as string[];
          if (!roles || roles.length === 0) {
            return false;
          }
          if (!filterValue || filterValue.length === 0) {
            return true;
          }
          return filterValue.some((role: string) => roles.includes(role));
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          // Only show the button if the user is currently selected/assigned
          if (row.getIsSelected()) {
            return (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(user.preferenceToken)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            );
          }
          return null;
        },
        enableColumnFilter: false,
        enableSorting: false,
      },
    ],
    [scheduleInstance.id, rowSelection]
  );

  const table = useReactTable({
    data: allPersonnel,
    columns,
    state: {
      rowSelection,
      columnFilters,
      globalFilter,
      columnVisibility,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    filterFns: {
      includesString: (row, columnId, filterValue: string) => {
        const rowValue = String(row.getValue(columnId)).toLowerCase();
        return rowValue.includes(filterValue.toLowerCase());
      },
    },
  });

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    for (const user of scheduleInstance.personnel) {
      const rowIndex = allPersonnel.findIndex((p) => p.id === user.id);
      if (rowIndex !== -1) {
        initialSelection[rowIndex.toString()] = true;
      }
    }
    setRowSelection(initialSelection);
  }, [allPersonnel, scheduleInstance.personnel]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const selectedPersonnelIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);

    const result = await assignResourcesToSchedule({
      scheduleInstanceId: scheduleInstance.id,
      personnelIds: selectedPersonnelIds,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  const handleExportPreferenceLinks = () => {
    setIsExporting(true);
    try {
      const selectedPersonnel = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);

      if (selectedPersonnel.length === 0) {
        toast.info("No personnel selected for export.");
        setIsExporting(false);
        return;
      }

      const csvRows = [];
      csvRows.push("Name,Email,Preference Link"); // CSV Header

      for (const user of selectedPersonnel) {
        if (user.preferenceToken) {
          const preferenceLink = `${window.location.origin}/preferences/${scheduleInstance.id}?token=${user.preferenceToken}`;
          csvRows.push(`"${user.name}","${user.email}","${preferenceLink}"`);
        } else {
          csvRows.push(
            `"${user.name}","${user.email}","No preference token available"`
          );
        }
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `preference_links_${scheduleInstance.id}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Preference links exported successfully!");
    } catch (error) {
      console.error("Error exporting preference links:", error);
      toast.error("Failed to export preference links.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailPreferenceLinks = async () => {
    setIsSendingEmails(true);
    const selectedPersonnel = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original);

    if (selectedPersonnel.length === 0) {
      toast.info("No personnel selected to email.");
      setIsSendingEmails(false);
      return;
    }

    let successfulEmails = 0;
    let failedEmails = 0;

    for (const user of selectedPersonnel) {
      if (user.email && user.preferenceToken) {
        try {
          const result = await sendPreferenceEmail({
            scheduleInstanceId: scheduleInstance.id,
            personnelId: user.id,
            email: user.email,
            preferenceToken: user.preferenceToken,
            userName: user.name,
          });

          if (result.success) {
            successfulEmails++;
            toast.success(`Sent Email to ${user.name}`);
          } else {
            failedEmails++;
            toast.error(`Failed to email ${user.name}: ${result.message}`);
          }
        } catch (error) {
          failedEmails++;
          console.error(`Error sending email to ${user.name}:`, error);
          toast.error(`Error sending email to ${user.name}`);
        }
      } else {
        failedEmails++;
        toast.warning(
          `Skipping email for ${user.name}: Missing email or preference token.`
        );
      }
    }

    if (successfulEmails > 0) {
      toast.success(
        `${successfulEmails} preference links emailed successfully!`
      );
    }
    if (failedEmails > 0) {
      toast.error(`${failedEmails} preference links failed to send.`);
    }

    setIsSendingEmails(false);
    toast.success(`Email Sending Process Completed!`);
  };

  return (
    <Card className="rounded-xl shadow-lg">
      <CardHeader className="rounded-t-xl">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <SlidersHorizontal className="h-7 w-7" />
            Assign Personnel
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportPreferenceLinks}
              disabled={isExporting}
              className="rounded-lg shadow-sm transition-all duration-200"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Preference Links"}
            </Button>
            <Button
              onClick={handleEmailPreferenceLinks}
              disabled={isSendingEmails}
              className="rounded-lg shadow-sm transition-all duration-200"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isSendingEmails ? "Sending Emails..." : "Email Personnel Links"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm flex-1 rounded-lg shadow-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto rounded-lg shadow-sm"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-xl border shadow-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer select-none flex items-center gap-1"
                                : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={`filter-${headerGroup.id}`}
                  className="bg-muted border-b"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={`filter-${header.id}`}
                      className="py-2 px-4"
                    >
                      {header.column.getCanFilter() ? (
                        <div className="flex items-center space-x-2">
                          {header.column.id === "roles" ? (
                            <Select
                              onValueChange={(value) =>
                                header.column.setFilterValue(
                                  value === "all" ? undefined : [value]
                                )
                              }
                            >
                              <SelectTrigger className="w-full text-left rounded-md shadow-sm text-sm">
                                <SelectValue placeholder="Filter roles..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {Array.from(
                                  table
                                    .getColumn("roles")
                                    ?.getFacetedUniqueValues()
                                    .keys() || []
                                ).map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder={`Filter ${header.column.columnDef.header}...`}
                              value={
                                (header.column.getFilterValue() as string) ?? ""
                              }
                              onChange={(e) =>
                                header.column.setFilterValue(e.target.value)
                              }
                              className="w-full rounded-md shadow-sm text-sm"
                            />
                          )}
                        </div>
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted border-b last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px] rounded-lg shadow-sm">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="ml-auto rounded-lg shadow-md transition-all duration-200"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
