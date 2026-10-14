"use client";

// The trigger is a searchable combobox; a native input/select cannot host the
// cmdk popover listbox, so `role="combobox"` on the button is intentional.
/* eslint-disable jsx-a11y/prefer-tag-over-role */

import * as React from "react";
import { RiCheckLine, RiArrowUpDownLine } from "@remixicon/react";
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
  id?: string;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Searchable Combobox selector for Faker.js providers, grouped by category.
 */
export function FakerProviderSelect({
  id,
  value,
  onValueChange,
  disabled,
}: FakerProviderSelectProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();
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
            type="button"
            id={id}
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-label="Select data provider"
            title="Select data provider"
            disabled={disabled}
            className="w-full justify-between"
          />
        }
      >
        <span className="truncate">
          {selectedProvider
            ? `${selectedProvider.category}: ${selectedProvider.label}`
            : "Select data provider..."}
        </span>
        <RiArrowUpDownLine className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent variant="flush" className="w-75" align="start">
        <Command>
          <CommandInput placeholder="Search mock data provider..." />
          <CommandList id={listboxId} className="max-h-75 overflow-y-auto">
            <CommandEmpty>No data provider found.</CommandEmpty>
            {groupedCategories.map((category) => (
              <CommandGroup key={category.name} heading={category.name}>
                {category.providers.map((provider) => (
                  <CommandItem
                    key={provider.value}
                    value={`${category.name} ${provider.label} ${provider.value}`}
                    onSelect={() => {
                      onValueChange(provider.value);
                      setOpen(false);
                    }}
                    className="justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {provider.label}
                      </span>
                      <span className="text-muted-foreground text-mini max-w-55 truncate">
                        Example: {provider.example}
                      </span>
                    </div>
                    <RiCheckLine
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
