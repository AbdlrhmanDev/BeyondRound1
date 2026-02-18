'use client';

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  triggerClassName?: string;
  /** For profile/light variant */
  variant?: "default" | "profile";
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  triggerClassName,
  variant = "default",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const triggerClass =
    variant === "profile"
      ? "h-12 rounded-[14px] bg-background border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-coral-500"
      : "h-14 bg-background/10 border-border/30 text-primary-foreground placeholder:text-primary-foreground/50 rounded-[18px]";

  const borderClass =
    variant === "profile" ? "border-border/60" : "border-border/30";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal border transition-all duration-200",
            triggerClass,
            borderClass,
            !value && variant !== "profile" && "border-coral-500/40",
            !value && variant === "profile" && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
            "text-warmgray-600"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[18px] border-border/60 shadow-hover"
        align="start"
      >
        <Command shouldFilter={true} className="rounded-[18px]">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[240px]">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isActive = value === option.value;
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-xl py-2.5 pl-9 pr-3 min-h-[44px] cursor-pointer transition-colors",
                      isActive
                        ? "bg-coral-500/15 text-coral-500 font-medium"
                        : "data-[selected='true']:bg-blush-200/30 data-[selected='true']:text-plum-900"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 absolute left-2.5 text-coral-500 transition-opacity",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
