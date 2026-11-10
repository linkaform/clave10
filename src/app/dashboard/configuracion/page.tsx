"use client";

import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMenuKeys } from "@/hooks/useMenuKeys";
import {
  CONFIG_TABS,
  ConfigSidebar,
  type ConfigTab,
} from "@/components/configuracion/config-sidebar";
import { ConfigPendingSection } from "@/components/configuracion/config-pending-section";
import { SistemaSection } from "@/components/configuracion/sistema-section";
import { MiPerfilSection } from "@/components/configuracion/mi-perfil-section";
import { MenusAdminSection } from "@/components/menus-admin/menus-admin-section";

function ConfiguracionContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { keys, isChecking: checkingAccess, error } = useMenuKeys();
  const canSee = (requiredKey?: string) =>
    !requiredKey || (!error && keys.includes(requiredKey));

  // Cada pestaña puede pedir una key. Mientras se revisa se muestran todas,
  // para no saltar de pestaña.
  const tabs = useMemo(
    () => CONFIG_TABS.filter((t) => checkingAccess || canSee(t.requiredKey)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keys, checkingAccess, error],
  );

  const requested = searchParams.get("tab") as ConfigTab | null;
  // Al entrar sin ?tab se abre Mi perfil (lo tiene todo usuario).
  const fallback: ConfigTab = "perfil";
  const active: ConfigTab =
    requested && tabs.some((t) => t.key === requested) ? requested : fallback;

  // Si piden Menús sin tener acceso, se cae a Sistema y se limpia la URL.
  useEffect(() => {
    if (checkingAccess) return;
    if (requested && requested !== active) {
      router.replace(`${pathname}?tab=${active}`);
    }
  }, [checkingAccess, requested, active, pathname, router]);

  const selectTab = (tab: ConfigTab) => {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const activeDef = tabs.find((t) => t.key === active);

  return (
    <div className="min-h-[calc(100vh-var(--c10-header-h,65px))] bg-c10-canvas font-[Arial,Helvetica,sans-serif]">
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-20 pt-6 min-[1080px]:px-5 min-[1080px]:pt-10 min-[1440px]:px-6 min-[1440px]:pt-12">
        <div className="sticky top-[var(--c10-header-h,65px)] z-20 -mx-4 bg-c10-canvas px-4 py-2 min-[1080px]:mx-0 min-[1080px]:px-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-c10-title min-[1080px]:text-[32px]">
            Configuración
          </h1>
        </div>

        <div className="flex flex-col gap-4 min-[1080px]:flex-row min-[1080px]:items-start min-[1080px]:gap-5">
          <ConfigSidebar tabs={tabs} active={active} onSelect={selectTab} />

          <div className="min-w-0 flex-1">
            {checkingAccess && active === "menus" ? (
              <div className="h-64 animate-pulse rounded-[20px] bg-c10-surface" />
            ) : active === "menus" ? (
              <MenusAdminSection />
            ) : active === "perfil" ? (
              <MiPerfilSection />
            ) : active === "sistema" ? (
              <SistemaSection />
            ) : (
              <ConfigPendingSection title={activeDef?.label ?? ""} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionContent />
    </Suspense>
  );
}
