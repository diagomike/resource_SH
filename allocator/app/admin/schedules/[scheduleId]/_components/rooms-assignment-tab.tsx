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
  getFacetedMinMaxValues,
  useReactTable,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { ScheduleInstance, Room } from "@prisma/client";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface RoomsAssignmentTabProps {
  scheduleInstance: ScheduleInstance & { rooms: Room[] };
  allRooms: Room[];
}

export function RoomsAssignmentTab({
  scheduleInstance,
  allRooms,
}: RoomsAssignmentTabProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
    () => {
      const initialSelection: Record<string, boolean> = {};
      for (const room of scheduleInstance.rooms) {
        const rowIndex = allRooms.findIndex((r) => r.id === room.id);
        if (rowIndex !== -1) {
          initialSelection[rowIndex.toString()] = true;
        }
      }
      return initialSelection;
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<Room>[] = useMemo(
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
      },
      {
        accessorKey: "building",
        header: "Building",
        cell: ({ row }) => row.getValue("building"),
        enableColumnFilter: true,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => row.getValue("type"),
        enableColumnFilter: true,
        filterFn: "includesString",
      },
      {
        accessorKey: "capacity",
        header: () => <div className="text-right">Capacity</div>,
        cell: ({ row }) => (
          <div className="text-right">{row.getValue("capacity")}</div>
        ),
        enableColumnFilter: true,
        filterFn: "inNumberRange",
      },
    ],
    []
  );

  const table = useReactTable({
    data: allRooms,
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
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: false,
    manualFiltering: false,
    filterFns: {
      inNumberRange: (row, columnId, value) => {
        const numValue = row.getValue(columnId) as number;
        if (!value || typeof numValue !== "number") return true;
        const [min, max] = value;
        if (min !== undefined && numValue < min) return false;
        if (max !== undefined && numValue > max) return false;
        return true;
      },
      includesString: (row, columnId, filterValue: string) => {
        const rowValue = String(row.getValue(columnId)).toLowerCase();
        return rowValue.includes(filterValue.toLowerCase());
      },
    },
  });

  useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    for (const room of scheduleInstance.rooms) {
      const rowIndex = allRooms.findIndex((r) => r.id === room.id);
      if (rowIndex !== -1) {
        initialSelection[rowIndex.toString()] = true;
      }
    }
    setRowSelection(initialSelection);
  }, [allRooms, scheduleInstance.rooms]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const selectedRoomIds = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original.id);

    const result = await assignResourcesToSchedule({
      scheduleInstanceId: scheduleInstance.id,
      roomIds: selectedRoomIds,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsSaving(false);
  };

  return (
    <Card className="rounded-xl shadow-lg">
      <CardHeader className="rounded-t-xl">
        <CardTitle className="text-3xl font-bold flex items-center gap-3">
          <SlidersHorizontal className="h-7 w-7" />
          Assign Rooms
        </CardTitle>
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
                          {header.column.id === "capacity" ? (
                            <div className="flex gap-2 w-full">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={
                                  (
                                    header.column.getFilterValue() as [
                                      number,
                                      number
                                    ]
                                  )?.[0] ?? ""
                                }
                                onChange={(e) =>
                                  header.column.setFilterValue(
                                    (old: [number, number]) => [
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                      old?.[1],
                                    ]
                                  )
                                }
                                className="w-1/2 rounded-md shadow-sm text-sm"
                              />
                              <Input
                                type="number"
                                placeholder="Max"
                                value={
                                  (
                                    header.column.getFilterValue() as [
                                      number,
                                      number
                                    ]
                                  )?.[1] ?? ""
                                }
                                onChange={(e) =>
                                  header.column.setFilterValue(
                                    (old: [number, number]) => [
                                      old?.[0],
                                      e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    ]
                                  )
                                }
                                className="w-1/2 rounded-md shadow-sm text-sm"
                              />
                            </div>
                          ) : header.column.id === "type" ? (
                            <Select
                              value={
                                (header.column.getFilterValue() as string) || ""
                              }
                              onValueChange={(value) =>
                                header.column.setFilterValue(
                                  value === "all" ? undefined : value
                                )
                              }
                            >
                              <SelectTrigger className="w-full text-left rounded-md shadow-sm text-sm">
                                <SelectValue placeholder="Filter type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {Array.from(
                                  table
                                    .getColumn("type")
                                    ?.getFacetedUniqueValues()
                                    .keys() || []
                                ).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
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
