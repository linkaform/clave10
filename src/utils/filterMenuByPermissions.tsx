import { MenuConfig } from "@/types/menu-types";
import { PERMISSION_MODULE_MAP } from "@/config/permission-module-map";

export const filterMenuByPermissions = (
  menu: MenuConfig,
  permissions: string[],
): MenuConfig => {
  if (!permissions || permissions.length === 0) return { modules: [] };

  const allowedSections = new Set<string>();

  for (const perm of permissions) {
    const sections = PERMISSION_MODULE_MAP[perm];
    if (sections) sections.forEach((s) => allowedSections.add(s));
  }

  return {
    modules: menu.modules
      .map((module) => ({
        ...module,
        sections: module.sections.filter((section) =>
          allowedSections.has(section.id),
        ),
      }))
      .filter((module) => module.sections.length > 0),
  };
};
