"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Camera, Eye, Loader2, Moon, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useAuthStore from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { changeUserPhoto, changeUserPhotoPatch } from "@/lib/change-user-photo";
import { ConfigCard } from "./config-card";

const PENDIENTE = "Todavía no disponible";

/**
 * Configuración > Mi perfil. Solo la foto tiene endpoint para que el propio
 * usuario la cambie; los datos y la contraseña se muestran pero quedan
 * deshabilitados hasta que exista su funcionalidad. El modo oscuro se guarda
 * en este dispositivo.
 */
export function MiPerfilSection() {
  const { userNameSoter, userEmailSoter, newUserUsername, userPhoto, userIdSoter, setUserPhoto } =
    useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const username = newUserUsername || userEmailSoter || "";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userIdSoter) return;
    if (!/^image\/(jpe?g|png)$/.test(file.type)) {
      toast.error("La foto debe ser JPG o PNG.");
      return;
    }
    setUploading(true);
    try {
      const res = await changeUserPhoto(userIdSoter, file);
      if (!res?.thumb) throw new Error();
      const ok = await changeUserPhotoPatch(userIdSoter, res.thumb);
      if (ok) {
        setUserPhoto(`${res.thumb}?t=${Date.now()}`);
        toast.success("Foto de perfil actualizada.");
      }
    } catch {
      toast.error("No se pudo cambiar la foto. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConfigCard title="Información personal">
        <div className="grid grid-cols-1 items-start gap-6 min-[1200px]:grid-cols-[minmax(240px,1fr)_2fr]">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <Avatar className="h-[148px] w-[148px]">
                <AvatarImage src={userPhoto || undefined} alt={userNameSoter || "Usuario"} className="object-cover" />
                <AvatarFallback className="bg-c10-sunken">
                  <User className="h-12 w-12 text-c10-faint" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Cambiar foto"
                aria-label="Cambiar foto"
                className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-c10-surface text-c10-label shadow-[0_2px_8px_rgba(15,23,42,.18)] transition-colors duration-150 hover:text-[#2F80ED] disabled:opacity-60">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-c10-title">{userNameSoter || "Usuario"}</span>
              <span className="text-[13px] text-c10-meta">
                Toca la cámara para cambiar tu foto. JPG o PNG.
              </span>
            </div>
          </div>

          {/* Datos (solo lectura por ahora) */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" value={userNameSoter || ""} />
              <Field label="Usuario" value={username} hint="Lo asigna el administrador." />
              <Field label="Correo electrónico" value={userEmailSoter || ""} />
              <Field label="Teléfono" value="" placeholder="Sin teléfono" />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-xs text-c10-faint">
                Para cambiar tus datos, pídeselo a tu administrador.
              </span>
              <button
                type="button"
                disabled
                title={PENDIENTE}
                className="h-10 cursor-not-allowed rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white opacity-40">
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      </ConfigCard>

      <DarkModeCard />

      {/* Contraseña: deshabilitada hasta que exista el endpoint */}
      <ConfigCard
        title={
          <span className="flex flex-col gap-1">
            Cambiar contraseña
            <span className="text-[13px] font-normal text-c10-meta">
              Crea una nueva contraseña para tu cuenta.
            </span>
          </span>
        }
        actions={
          <button
            type="button"
            disabled
            title={PENDIENTE}
            className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg bg-c10-sunken px-3 text-[13px] font-semibold text-c10-secondary opacity-60">
            <Eye className="h-4 w-4" />
            Mostrar
          </button>
        }>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField label="Nueva contraseña" />
          <PasswordField label="Confirmar nueva contraseña" />
        </div>
        <p className="text-xs text-c10-faint">
          {PENDIENTE}. Mientras tanto usa &quot;¿Olvidó su contraseña?&quot; en el inicio de sesión.
        </p>
      </ConfigCard>
    </div>
  );
}

function Field({
  label,
  value,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-c10-label">{label}</span>
      <input
        value={value}
        readOnly
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-c10-line bg-c10-panel px-3 text-sm text-c10-secondary outline-none placeholder:text-c10-faint"
      />
      {hint && <span className="text-xs text-c10-faint">{hint}</span>}
    </label>
  );
}

function PasswordField({ label }: { label: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-c10-label">{label}</span>
      <input
        type="password"
        disabled
        title={PENDIENTE}
        className="h-11 w-full cursor-not-allowed rounded-lg border border-c10-line bg-c10-panel px-3 text-sm outline-none"
      />
    </label>
  );
}

/** Switch de modo oscuro (next-themes, guardado en este dispositivo). */
function DarkModeCard() {
  const { resolvedTheme, setTheme } = useTheme();
  // El tema solo se conoce en el cliente: evita parpadeo al hidratar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section className="flex items-center gap-4 rounded-[20px] bg-c10-surface px-[22px] py-4 shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-c10-sunken text-c10-secondary">
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold text-c10-title">Modo oscuro</span>
        <span className="text-[13px] text-c10-meta">
          {isDark
            ? "Activado. Se guarda en este dispositivo."
            : "Reduce el brillo de la pantalla durante la noche."}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Modo oscuro"
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "relative h-[34px] w-16 shrink-0 overflow-hidden rounded-full shadow-[inset_0_1px_3px_rgba(15,23,42,.18)] transition-colors duration-500",
          isDark ? "bg-[#1D3A72]" : "bg-c10-line",
        )}>
        <span
          className={cn(
            "absolute top-1 flex h-[26px] w-[26px] items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,.25)] transition-all duration-500",
            // Perilla siempre clara (no token): la luna/sol se lee en ambos temas.
            isDark ? "left-[34px] bg-[rgb(226,232,240)]" : "left-1 bg-[rgb(255,255,255)]",
          )}>
          {isDark ? (
            <Moon className="h-3.5 w-3.5 text-[#1D3A72]" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-[#F59E0B]" />
          )}
        </span>
      </button>
    </section>
  );
}
