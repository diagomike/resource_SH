"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input"; // Corrected import path
import { Button } from "@/components/ui/button"; // Corrected import path
import { Badge } from "@/components/ui/badge"; // Corrected import path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Corrected import path
import { Card, CardContent } from "@/components/ui/card"; // Corrected import path
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Corrected import path
import { Search, Filter, X, SlidersHorizontal } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Corrected import path
import { Label } from "@/components/ui/label"; // Corrected import path
import { Checkbox } from "@/components/ui/checkbox"; // Corrected import path

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "multiselect" | "range" | "boolean";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface EnhancedTableProps {
  data: any[];
  columns: {
    key: string;
    label: string | React.ReactNode; // Label can be a ReactNode for custom headers (like checkboxes)
    render?: (value: any, row: any) => React.ReactNode;
    searchable?: boolean;
    sortable?: boolean;
  }[];
  filterOptions?: FilterOption[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  onRowAction?: (action: string, row: any) => void;
  actions?: {
    key: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "default" | "outline" | "destructive";
  }[];
  // New props for selection
  enableSelection?: boolean;
  initialSelectedRowIds?: string[]; // For pre-selecting rows by ID
  onSelectionChange?: (selectedRows: any[]) => void;
}

export default function EnhancedTable({
  data,
  columns,
  filterOptions = [],
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  onRowAction,
  actions = [],
  enableSelection = false,
  initialSelectedRowIds = [],
  onSelectionChange,
}: EnhancedTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(
    new Set(initialSelectedRowIds)
  );

  // Update selectedRowIds when initialSelectedRowIds changes
  useEffect(() => {
    setSelectedRowIds(new Set(initialSelectedRowIds));
  }, [initialSelectedRowIds]);

  // Get searchable columns
  const searchableColumns = columns.filter((col) => col.searchable !== false);

  // Filter and search data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((row) =>
        searchableColumns.some((col) => {
          const value = row[col.key];
          if (value == null) return false;
          // Handle nested keys for search if present
          if (col.key.includes(".")) {
            const keys = col.key.split(".");
            let nestedValue = row;
            for (const k of keys) {
              if (
                nestedValue &&
                typeof nestedValue === "object" &&
                k in nestedValue
              ) {
                nestedValue = nestedValue[k];
              } else {
                nestedValue = undefined;
                break;
              }
            }
            if (nestedValue == null) return false;
            return String(nestedValue).toLowerCase().includes(searchLower);
          }
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0)
      )
        return;

      const filterOption = filterOptions.find((opt) => opt.key === filterKey);
      if (!filterOption) return;

      result = result.filter((row) => {
        // Handle nested keys for filtering
        let rowValue = row[filterKey];
        if (filterKey.includes(".")) {
          const keys = filterKey.split(".");
          let nestedValue = row;
          for (const k of keys) {
            if (
              nestedValue &&
              typeof nestedValue === "object" &&
              k in nestedValue
            ) {
              nestedValue = nestedValue[k];
            } else {
              nestedValue = undefined;
              break;
            }
          }
          rowValue = nestedValue;
        }

        switch (filterOption.type) {
          case "select":
            return rowValue === filterValue;
          case "multiselect":
            return Array.isArray(filterValue) && filterValue.includes(rowValue);
          case "range":
            const [min, max] = filterValue;
            const numValue = Number(rowValue);
            return numValue >= min && numValue <= max;
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
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested keys for sorting
        if (sortConfig.key.includes(".")) {
          const keys = sortConfig.key.split(".");
          let nestedA = a;
          let nestedB = b;
          for (const k of keys) {
            if (nestedA && typeof nestedA === "object" && k in nestedA) {
              nestedA = nestedA[k];
            } else {
              nestedA = undefined;
              break;
            }
            if (nestedB && typeof nestedB === "object" && k in nestedB) {
              nestedB = nestedB[k];
            } else {
              nestedB = undefined;
              break;
            }
          }
          aValue = nestedA;
          bValue = nestedB;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, searchableColumns, filterOptions]);

  // Call onSelectionChange when selectedRowIds or filteredAndSortedData changes
  useEffect(() => {
    if (enableSelection && onSelectionChange) {
      const selectedRows = filteredAndSortedData.filter((row) =>
        selectedRowIds.has(row.id)
      );
      onSelectionChange(selectedRows);
    }
  }, [
    selectedRowIds,
    filteredAndSortedData,
    enableSelection,
    onSelectionChange,
  ]);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleFilterChange = (filterKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) =>
      value !== undefined &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0)
  ).length;

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Handle row selection
  const handleToggleRowSelection = (rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      return newSelection;
    });
  };

  const handleToggleAllRowsSelection = (checked: boolean) => {
    setSelectedRowIds((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        filteredAndSortedData.forEach((row) => newSelection.add(row.id));
      } else {
        filteredAndSortedData.forEach((row) => newSelection.delete(row.id));
      }
      return newSelection;
    });
  };

  const isAllRowsSelected = useMemo(() => {
    if (!enableSelection || filteredAndSortedData.length === 0) return false;
    return filteredAndSortedData.every((row) => selectedRowIds.has(row.id));
  }, [enableSelection, filteredAndSortedData, selectedRowIds]);

  // Columns to display, including the selection column if enabled
  const displayColumns = useMemo(() => {
    if (!enableSelection) {
      return columns;
    }
    return [
      {
        key: "select",
        label: (
          <Checkbox
            checked={isAllRowsSelected}
            onCheckedChange={(value: boolean) =>
              handleToggleAllRowsSelection(value)
            }
            aria-label="Select all"
          />
        ),
        render: (value: any, row: any) => (
          <Checkbox
            checked={selectedRowIds.has(row.id)}
            onCheckedChange={(value: boolean) =>
              handleToggleRowSelection(row.id, value)
            }
            aria-label="Select row"
          />
        ),
        sortable: false,
        searchable: false,
      },
      ...columns,
    ];
  }, [columns, enableSelection, selectedRowIds, isAllRowsSelected]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchTerm("")}
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
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 p-0 text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Filters</h4>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>

                  {filterOptions.map((option) => (
                    <div key={option.key} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {option.label}
                      </Label>

                      {option.type === "select" && (
                        <Select
                          value={filters[option.key] || ""}
                          onValueChange={(value) =>
                            handleFilterChange(
                              option.key,
                              value === "all" ? undefined : value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${option.label.toLowerCase()}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
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
                        <div className="space-y-2 max-h-32 overflow-y-auto">
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
                              />
                              <Label
                                htmlFor={`${option.key}-${opt.value}`}
                                className="text-sm cursor-pointer"
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
                          />
                        </div>
                      )}

                      {option.type === "boolean" && (
                        <Select
                          value={
                            filters[option.key] !== undefined
                              ? String(filters[option.key])
                              : ""
                          }
                          onValueChange={(value) =>
                            handleFilterChange(
                              option.key,
                              value === "" || value === "all"
                                ? undefined
                                : value === "true"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
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
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0))
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
            } else if (option.type === "range" && Array.isArray(value)) {
              displayValue = `${value[0]} - ${value[1]}`;
            } else if (option.type === "boolean") {
              displayValue = value ? "Yes" : "No";
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {option.label}: {String(displayValue)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
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
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {filteredAndSortedData.length} of {data.length} records
          {searchTerm && ` for "${searchTerm}"`}
        </span>
        {filteredAndSortedData.length !== data.length && (
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="p-0 h-auto"
          >
            Show all records
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || activeFiltersCount > 0
                  ? "No matching records"
                  : emptyMessage}
              </h3>
              {(searchTerm || activeFiltersCount > 0) && (
                <p className="mb-4">Try adjusting your search or filters</p>
              )}
              {(searchTerm || activeFiltersCount > 0) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayColumns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={
                          column.sortable !== false
                            ? "cursor-pointer hover:bg-gray-50"
                            : ""
                        }
                        onClick={() =>
                          column.sortable !== false && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {typeof column.label === "string"
                            ? column.label
                            : column.label}
                          {column.sortable !== false && (
                            <span className="text-xs opacity-50">
                              {getSortIcon(column.key)}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    {actions.length > 0 && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((row, index) => (
                    <TableRow key={row.id || index}>
                      {displayColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render
                            ? column.render(row[column.key], row)
                            : column.key.includes(".")
                            ? getNestedValue(row, column.key)
                            : row[column.key]}
                        </TableCell>
                      ))}
                      {actions.length > 0 && (
                        <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get nested value from an object
function getNestedValue(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}
