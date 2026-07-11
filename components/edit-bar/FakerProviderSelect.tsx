"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGroupedProviders, getProviderByValue } from "@/lib/faker-registry";
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

interface FakerProviderSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Searchable Combobox selector for Faker.js providers, grouped by category.
 */
export function FakerProviderSelect({
  value,
  onValueChange,
  disabled,
}: FakerProviderSelectProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const groupedCategories = React.useMemo(() => getGroupedProviders(), []);

  const selectedProvider = React.useMemo(() => {
    if (!value) return null;
    return getProviderByValue(value) ?? null;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="border-muted-foreground/20 hover:bg-accent h-7 w-full justify-between px-2 text-xs"
          />
        }
      >
        <span className="truncate">
          {selectedProvider
            ? `${selectedProvider.category}: ${selectedProvider.label}`
            : "Select data provider..."}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search mock data provider..."
            className="h-9 text-xs"
          />
          <CommandList className="max-h-75 overflow-y-auto">
            <CommandEmpty className="text-muted-foreground py-3 text-center text-xs">
              No data provider found.
            </CommandEmpty>
            {groupedCategories.map((category) => (
              <CommandGroup
                key={category.name}
                heading={category.name}
                className="text-muted-foreground text-[10px] font-semibold"
              >
                {category.providers.map((provider) => (
                  <CommandItem
                    key={provider.value}
                    value={`${category.name} ${provider.label} ${provider.value}`}
                    onSelect={() => {
                      onValueChange(provider.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {provider.label}
                      </span>
                      <span className="text-muted-foreground max-w-55 truncate text-[10px]">
                        Example: {provider.example}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "text-primary h-4 w-4 shrink-0",
                        value === provider.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
export default FakerProviderSelect;
