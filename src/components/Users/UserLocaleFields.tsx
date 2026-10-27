"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Control } from "react-hook-form";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useUserOptions } from "@/hooks/Users/useUsers";

interface Option {
  value: string;
  label: string;
}

// Select con búsqueda: una lista de 143 zonas no se maneja bien con un select simple.
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected?.label ?? (value || placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      o.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  // Cualquier formulario con campos `timezone` y `language` de texto.
  control: Control<any>;
  /** En edición, un usuario anterior a estos campos puede no tener valor. */
  emptyLabel?: string;
  /** Qué pasa con estos campos si las opciones no se pueden cargar. */
  unavailableNote?: string;
}

// Uso Horario e Idioma del usuario. Las listas vienen del backend (una sola
// fuente con el form de LinkaForm).
export function UserLocaleFields({
  control,
  emptyLabel = "Selecciona",
  unavailableNote = "Se usarán la zona horaria y el idioma por defecto.",
}: Props) {
  const { data: options, isError, error } = useUserOptions();
  const timezones: Option[] = (options?.timezones ?? []).map((z) => ({
    value: z,
    label: z,
  }));
  const languages = options?.languages ?? [];

  // Si las opciones no cargan (por ejemplo, el backend no las tiene todavía) se
  // dice por qué en vez de mostrar selects vacíos y bloqueados.
  if (isError) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        No se pudieron cargar las opciones de Uso Horario e Idioma (
        {(error as Error).message}). {unavailableNote}
      </p>
    );
  }

  return (
    <>
      <FormField
        control={control}
        name="timezone"
        render={({ field }: any) => (
          <FormItem className="flex flex-col">
            <FormLabel>Uso Horario</FormLabel>
            <SearchableSelect
              value={field.value ?? ""}
              onChange={field.onChange}
              options={timezones}
              placeholder={emptyLabel}
              disabled={timezones.length === 0}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="language"
        render={({ field }: any) => (
          <FormItem>
            <FormLabel>Idioma</FormLabel>
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={languages.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={emptyLabel} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
