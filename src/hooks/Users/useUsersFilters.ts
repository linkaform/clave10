"use client";

import { useMemo, useState } from "react";
import { SearchFacet, SearchFieldConfig } from "@/components/common/FacetSearch";
import { UserFiltersState } from "@/lib/users-sdk";

// Campos del buscador por facets de Usuarios. Estatus es un enum (igualdad);
// el resto busca "contiene". Mismo contrato que useFacetSection, pero estático:
// aquí no hay panel de filtros ni conteos por opción.
export const USER_STATUS_LABELS: Record<string, string> = {
  crear: "Crear",
  creado: "Creado",
  activado: "Activado",
  restaurar: "Restaurar",
};

export const USER_SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    key: "status",
    label: "Estatus",
    type: "enum",
    options: Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  { key: "name", label: "Nombre", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "username", label: "Username", type: "text" },
];

const valuesOf = (facets: SearchFacet[], key: string) =>
  facets.filter((f) => f.key === key).flatMap((f) => f.values);

export function useUsersFilters() {
  const [facets, setFacets] = useState<SearchFacet[]>([]);

  const queryFilters: UserFiltersState = useMemo(
    () => ({
      statuses: valuesOf(facets, "status"),
      names: valuesOf(facets, "name"),
      usernames: valuesOf(facets, "username"),
      emails: valuesOf(facets, "email"),
    }),
    [facets],
  );

  return { fields: USER_SEARCH_FIELDS, facets, setFacets, queryFilters };
}
