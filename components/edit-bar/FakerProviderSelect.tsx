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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}: FakerProviderSelectProps) {
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
            className="w-full justify-between h-9 text-xs border-muted-foreground/20 hover:bg-accent"
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
          <CommandInput placeholder="Search mock data provider..." className="h-9 text-xs" />
          <CommandList className="max-h-75 overflow-y-auto">
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground">
              No data provider found.
            </CommandEmpty>
            {groupedCategories.map((category) => (
              <CommandGroup key={category.name} heading={category.name} className="text-[10px] font-semibold text-muted-foreground">
                {category.providers.map((provider) => (
                  <CommandItem
                    key={provider.value}
                    value={`${category.name} ${provider.label} ${provider.value}`}
                    onSelect={() => {
                      onValueChange(provider.value);
                      setOpen(false);
                    }}
                    className="text-xs flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{provider.label}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-55">
                        Example: {provider.example}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary shrink-0",
                        value === provider.value ? "opacity-100" : "opacity-0"
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
