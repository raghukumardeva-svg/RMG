import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { EmployeeSearchResult } from "@/types/ctc";
import ctcService from "@/services/ctcService";
import { toast } from "sonner";

interface EmployeeSearchProps {
  readonly value?: string;
  readonly onSelect: (employee: EmployeeSearchResult | null) => void;
  readonly disabled?: boolean;
  readonly placeholder?: string;
}

export function EmployeeSearch({
  value,
  onSelect,
  disabled = false,
  placeholder = "Search employee...",
}: EmployeeSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSearchResult | null>(null);

  const searchEmployees = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setEmployees([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await ctcService.searchEmployees(query);
      setEmployees(results);
    } catch (error) {
      console.error("Error searching employees:", error);
      toast.error("Failed to search employees");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEmployees(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchEmployees]);

  const handleSelect = (employee: EmployeeSearchResult) => {
    setSelectedEmployee(employee);
    onSelect(employee);
    setOpen(false);
  };

  const displayValue = selectedEmployee
    ? `${selectedEmployee.employeeId} (${selectedEmployee.name})`
    : value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type employee ID or name..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchQuery.length < 2
                    ? "Type at least 2 characters to search"
                    : "No employees found"}
                </CommandEmpty>
                <CommandGroup>
                  {employees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.employeeId}
                      onSelect={() => handleSelect(employee)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmployee?.id === employee.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.employeeId} ({employee.name})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {employee.email}
                          {employee.department && ` • ${employee.department}`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
