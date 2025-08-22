"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Define the shape of a filter option
interface FilterOption {
  key: string;
  label: string;
  type: "select" | "multiselect" | "range" | "boolean";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

// Props for the TanstackEnhancedTable component
interface TanstackEnhancedTableProps<TData extends object> {
  data: TData[]; // Array of data objects
  columns: {
    // Column definitions
    key: string;
    label: string;
    render?: (value: any, row: TData) => React.ReactNode;
    searchable?: boolean;
    sortable?: boolean;
  }[];
  filterOptions?: FilterOption[]; // Options for custom filters
  searchPlaceholder?: string; // Placeholder text for the search input
  emptyMessage?: string; // Message to display when no data is found
  onRowAction?: (action: string, row: TData) => void; // Callback for row actions
  actions?: {
    // Actions that can be performed on each row
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "destructive";
  }[];
}

export default function TanstackEnhancedTable<TData extends object>({
  data,
  columns,
  filterOptions = [],
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  onRowAction,
  actions = [],
}: TanstackEnhancedTableProps<TData>) {
  // State for global search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for custom filters
  const [filters, setFilters] = useState<Record<string, any>>({});
  // State for sorting configuration
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  // State for showing the filter popover
  const [showFilters, setShowFilters] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Memoize searchable columns for efficient lookup
  const searchableColumns = useMemo(
    () => columns.filter((col) => col.searchable !== false),
    [columns]
  );

  // Filter, search, and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global search based on searchable columns
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        searchableColumns.some((col) => {
          const value = (row as any)[col.key]; // Cast to any to access property by string key
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply custom filters
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0) ||
        filterValue === "all" // "all" is a special value to ignore filter
      ) {
        return;
      }

      const filterOption = filterOptions.find((opt) => opt.key === filterKey);
      if (!filterOption) return;

      result = result.filter((row) => {
        const rowValue = (row as any)[filterKey];

        switch (filterOption.type) {
          case "select":
            return String(rowValue) === String(filterValue); // Ensure type consistency for comparison
          case "multiselect":
            return (
              Array.isArray(filterValue) &&
              filterValue.includes(String(rowValue))
            );
          case "range":
            const [min, max] = filterValue;
            const numValue = Number(rowValue);
            return !isNaN(numValue) && numValue >= min && numValue <= max;
          case "boolean":
            return Boolean(rowValue) === filterValue;
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key];
        const bValue = (b as any)[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, searchableColumns, filterOptions]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle sort changes
  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
    setCurrentPage(1); // Reset to first page on sort
  };

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Clear all search and custom filters
  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setSortConfig(null); // Clear sorting
    setCurrentPage(1); // Reset to first page
  };

  // Count active custom filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) =>
      value !== undefined &&
      value !== "" &&
      value !== "all" && // Ignore "all" in count
      (!Array.isArray(value) || value.length > 0)
  ).length;

  // Get sort icon for table header
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <Card className="rounded-xl overflow-hidden shadow-lg border">
      <CardContent className="p-6 space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px] max-w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="pl-10 rounded-lg pr-8 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1); // Reset page on clear search
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          {filterOptions.length > 0 && (
            <div className="flex gap-2">
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative rounded-lg px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 w-5 p-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center"
                      >
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-4 rounded-lg shadow-xl"
                  align="end"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-muted">
                      <h4 className="font-semibold text-lg">Filters</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {filterOptions.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <Label className="font-medium">{option.label}</Label>

                        {option.type === "select" && (
                          <Select
                            value={filters[option.key] || "all"} // Default to "all" for select
                            onValueChange={(value) =>
                              handleFilterChange(
                                option.key,
                                value === "all" ? undefined : value
                              )
                            }
                          >
                            <SelectTrigger className="rounded-md">
                              <SelectValue
                                placeholder={`Select ${option.label.toLowerCase()}`}
                              />
                            </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg">
                              <SelectItem value="all">All</SelectItem>
                              {option.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {option.type === "multiselect" && (
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {option.options?.map((opt) => (
                              <div
                                key={opt.value}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`${option.key}-${opt.value}`}
                                  checked={(filters[option.key] || []).includes(
                                    opt.value
                                  )}
                                  onCheckedChange={(checked) => {
                                    const current = filters[option.key] || [];
                                    const updated = checked
                                      ? [...current, opt.value]
                                      : current.filter(
                                          (v: string) => v !== opt.value
                                        );
                                    handleFilterChange(
                                      option.key,
                                      updated.length > 0 ? updated : undefined
                                    );
                                  }}
                                  className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label
                                  htmlFor={`${option.key}-${opt.value}`}
                                  className="cursor-pointer"
                                >
                                  {opt.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}

                        {option.type === "range" && (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              min={option.min}
                              max={option.max}
                              value={filters[option.key]?.[0] || ""}
                              onChange={(e) => {
                                const current = filters[option.key] || [
                                  option.min || 0,
                                  option.max || 100,
                                ];
                                handleFilterChange(option.key, [
                                  Number(e.target.value) || option.min || 0,
                                  current[1],
                                ]);
                              }}
                              className="rounded-md"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              min={option.min}
                              max={option.max}
                              value={filters[option.key]?.[1] || ""}
                              onChange={(e) => {
                                const current = filters[option.key] || [
                                  option.min || 0,
                                  option.max || 100,
                                ];
                                handleFilterChange(option.key, [
                                  current[0],
                                  Number(e.target.value) || option.max || 100,
                                ]);
                              }}
                              className="rounded-md"
                            />
                          </div>
                        )}

                        {option.type === "boolean" && (
                          <Select
                            value={
                              filters[option.key] !== undefined
                                ? String(filters[option.key])
                                : "all"
                            }
                            onValueChange={(value) =>
                              handleFilterChange(
                                option.key,
                                value === "all" ? undefined : value === "true"
                              )
                            }
                          >
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent className="rounded-md shadow-lg">
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {(activeFiltersCount > 0 || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 pb-4">
            {Object.entries(filters).map(([key, value]) => {
              if (
                !value ||
                (Array.isArray(value) && value.length === 0) ||
                value === "all"
              )
                return null;

              const option = filterOptions.find((opt) => opt.key === key);
              if (!option) return null;

              let displayValue = value;
              if (option.type === "multiselect" && Array.isArray(value)) {
                displayValue = value
                  .map(
                    (v) =>
                      option.options?.find((opt) => opt.value === v)?.label || v
                  )
                  .join(", ");
              } else if (option.type === "select") {
                displayValue =
                  option.options?.find((opt) => opt.value === value)?.label ||
                  value;
              } else if (option.type === "boolean") {
                displayValue = value ? "Yes" : "No";
              } else if (option.type === "range" && Array.isArray(value)) {
                displayValue = `${value[0]} - ${value[1]}`;
              }

              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 bg-blue-50 text-blue-700 border-blue-200 rounded-md px-3 py-1"
                >
                  {option.label}:{" "}
                  <span className="font-medium">{String(displayValue)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 text-blue-500 hover:bg-blue-100 rounded-full"
                    onClick={() => handleFilterChange(key, undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center space-x-2 py-4">
          <span>
            Showing <span className="font-semibold">{currentItems.length}</span>{" "}
            of <span className="font-semibold">{processedData.length}</span>{" "}
            {processedData.length === 1 ? "record" : "records"}
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {(activeFiltersCount > 0 || searchTerm) && (
            <Button
              variant="link"
              size="sm"
              onClick={clearFilters}
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              Show all records
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden shadow-sm">
          {processedData.length === 0 ? (
            <div className="text-center py-12 bg-muted">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">
                {searchTerm || activeFiltersCount > 0
                  ? "No matching records found"
                  : emptyMessage}
              </h3>
              {(searchTerm || activeFiltersCount > 0) && (
                <p className="mb-4">Try adjusting your search or filters</p>
              )}
              {(searchTerm || activeFiltersCount > 0) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="rounded-lg hover:bg-muted"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow className="border-b border-muted">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={
                          column.sortable !== false
                            ? "cursor-pointer hover:bg-muted select-none h-12 px-4 text-left font-medium uppercase tracking-wider"
                            : "h-12 px-4 text-left font-medium uppercase tracking-wider"
                        }
                        onClick={() =>
                          column.sortable !== false && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable !== false && (
                            <span className="opacity-50">
                              {getSortIcon(column.key)}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    {actions.length > 0 && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-muted">
                  {currentItems.map((row, index) => (
                    <TableRow
                      key={(row as any).id || index}
                      className="hover:bg-muted transition-colors duration-150"
                    >
                      {columns.map((column) => (
                        <TableCell key={column.key} className="py-3 px-4">
                          {column.render
                            ? column.render((row as any)[column.key], row)
                            : String((row as any)[column.key])}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell className="text-right py-3 px-4">
                          <div className="flex justify-end gap-2">
                            {actions.map((action) => (
                              <Button
                                key={action.key}
                                variant={action.variant || "outline"}
                                size="sm"
                                onClick={() => onRowAction?.(action.key, row)}
                              >
                                {action.icon}
                                <span className="sr-only sm:not-sr-only sm:ml-2">
                                  {action.label}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between space-x-2 py-4">
          {/* Page Size Selector */}
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <Select
              value={`${itemsPerPage}`}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when page size changes
              }}
            >
              <SelectTrigger className="h-9 w-[70px] rounded-md border-gray-300">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Number Display */}
          <div className="flex w-[100px] items-center justify-center font-medium">
            Page {currentPage} of {totalPages}
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-md hover:bg-muted"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-md hover:bg-muted"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-md hover:bg-muted"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0 rounded-md hover:bg-muted"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
