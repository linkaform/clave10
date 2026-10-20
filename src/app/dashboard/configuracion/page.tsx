"use client";

import React, { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  ListTree,
  Lock,
  Moon,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Check,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { changeUserPhoto, changeUserPhotoPatch } from "@/lib/change-user-photo";

type TabId = "perfil" | "sistema";

const TABS: { id: TabId | "menus"; label: string; icon: LucideIcon; href?: string }[] = [
  { id: "perfil", label: "Mi perfil", icon: User },
  // El editor de menús ya existe en su propia pantalla.
  { id: "menus", label: "Menús", icon: ListTree, href: "/dashboard/admin/menus" },
  { id: "sistema", label: "Sistema", icon: Settings },
];

const cardClassName =
  "rounded-[20px] bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_6px_20px_rgba(15,23,42,.04)]";

const ConfiguracionContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: TabId = searchParams.get("tab") === "sistema" ? "sistema" : "perfil";
  const tabLabel = TABS.find((t) => t.id === tab)?.label;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F3F5F8]">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-5 md:px-8 md:py-6 pb-24 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <span>Configuración</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{tabLabel}</span>
          </div>
          <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-slate-900">Configuración</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <nav
            className={cn(
              cardClassName,
              "lg:sticky lg:top-24 w-full lg:w-[240px] flex-shrink-0 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto",
            )}>
            {TABS.map((t) => {
              const active = t.id === tab;
              const className = cn(
                "min-h-11 flex-shrink-0 flex items-center gap-2.5 px-3 rounded-xl text-sm whitespace-nowrap text-left transition-colors",
                active ? "bg-[#EFF6FF] text-[#2F80ED] font-semibold" : "text-slate-700 font-medium hover:bg-slate-50",
              );
              const content = (
                <>
                  <t.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span className="flex-1">{t.label}</span>
                </>
              );
              return t.href ? (
                <Link key={t.id} href={t.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => router.replace(`/dashboard/configuracion?tab=${t.id}`)}
                  className={className}>
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 min-w-0 w-full">{tab === "perfil" ? <PerfilTab /> : <SistemaTab />}</div>
        </div>
      </div>
    </div>
  );
};

function PerfilTab() {
  const { userNameSoter, userEmailSoter, newUserUsername, userPhoto, userIdSoter, setUserPhoto } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const initial = {
    name: userNameSoter || "",
    email: userEmailSoter || "",
    phone: "",
  };
  const [form, setForm] = useState(initial);
  const dirty = form.name !== initial.name || form.email !== initial.email || form.phone !== initial.phone;

  const [darkMode, setDarkMode] = useState(false);

  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const rules = [
    { label: "Mínimo 8 caracteres", ok: pwd.next.length >= 8 },
    { label: "Una mayúscula", ok: /[A-ZÁÉÍÓÚÑ]/.test(pwd.next) },
    { label: "Un número", ok: /\d/.test(pwd.next) },
    { label: "Las contraseñas coinciden", ok: !!pwd.next && pwd.next === pwd.confirm },
  ];
  const pwdValid = rules.every((r) => r.ok);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await changeUserPhoto(userIdSoter, file);
      if (res?.thumb && (await changeUserPhotoPatch(userIdSoter, res.thumb))) {
        setUserPhoto(`${res.thumb}?t=${Date.now()}`);
        toast.success("Foto de perfil cambiada correctamente");
      } else {
        toast.error("No se pudo cambiar la foto");
      }
    } catch {
      toast.error("No se pudo cambiar la foto");
    } finally {
      setUploading(false);
    }
  };

  const displayName = form.name || newUserUsername || "Usuario";
  const initials = displayName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full max-w-[1100px] mx-auto flex flex-col gap-4">
      <section className={cn(cardClassName, "px-[22px] pt-5 pb-[22px] flex flex-col gap-5")}>
        <SectionTitle title="Información personal" />
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="md:w-[260px] flex-shrink-0 flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <div className="h-[120px] w-[120px] rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-3xl font-semibold text-slate-400">
                {userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userPhoto} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                title="Cambiar foto"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-0 bottom-0 h-9 w-9 rounded-full bg-white text-slate-600 shadow-[0_1px_4px_rgba(15,23,42,.18)] flex items-center justify-center transition-colors hover:text-[#2F80ED] disabled:opacity-60">
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhoto} />
            </div>
            <div className="mt-1 text-[15px] font-semibold text-slate-900 break-all">{displayName}</div>
            <div className="text-xs text-slate-500">
              {uploading ? "Subiendo foto…" : "Toca la cámara para cambiar tu foto. JPG o PNG."}
            </div>
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 content-start">
            <Field label="Nombre completo">
              <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            </Field>
            <Field label="Usuario" hint="Lo asigna tu administrador.">
              <TextInput value={newUserUsername || userEmailSoter || ""} disabled />
            </Field>
            <Field label="Correo electrónico">
              <TextInput type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </Field>
            <Field label="Teléfono">
              <TextInput type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </Field>
            <div className="sm:col-span-2 flex justify-end pt-1">
              <PrimaryButton disabled={!dirty} onClick={() => toast("Pendiente: guardar información personal")}>
                Guardar cambios
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      <section className={cn(cardClassName, "px-[22px] py-4 flex items-center gap-3.5")}>
        <span className="h-9 w-9 flex-shrink-0 rounded-[10px] bg-slate-100 text-slate-500 flex items-center justify-center">
          {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </span>
        <span className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-slate-900">Modo oscuro</span>
          <span className="text-[13px] text-slate-500">Reduce el brillo de la pantalla durante la noche.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          aria-label="Modo oscuro"
          onClick={() => {
            setDarkMode((d) => !d);
            toast("Pendiente: el modo oscuro aún no se aplica a toda la app");
          }}
          className={cn(
            "relative h-7 w-[52px] flex-shrink-0 rounded-full transition-colors",
            darkMode ? "bg-[#2F80ED]" : "bg-slate-200",
          )}>
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,.2)] flex items-center justify-center transition-[left]",
              darkMode ? "left-[26px] text-[#2F80ED]" : "left-0.5 text-amber-500",
            )}>
            {darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </span>
        </button>
      </section>

      <section className={cn(cardClassName, "px-[22px] pt-5 pb-[22px] flex flex-col gap-4")}>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle title="Cambiar contraseña" subtitle="Crea una nueva contraseña para tu cuenta." />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="h-8 px-2.5 flex-shrink-0 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors hover:bg-slate-200">
            {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPwd ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nueva contraseña">
            <TextInput type={showPwd ? "text" : "password"} value={pwd.next} onChange={(v) => setPwd({ ...pwd, next: v })} />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <TextInput type={showPwd ? "text" : "password"} value={pwd.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {rules.map((r) => (
            <span key={r.label} className={cn("flex items-center gap-1.5 text-xs", r.ok ? "text-green-600" : "text-slate-500")}>
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded-full flex items-center justify-center",
                  r.ok ? "bg-green-600 text-white" : "border border-slate-300",
                )}>
                {r.ok && <Check className="h-2.5 w-2.5" />}
              </span>
              {r.label}
            </span>
          ))}
        </div>
        <div className="flex justify-end">
          <PrimaryButton disabled={!pwdValid} onClick={() => toast("Pendiente: actualizar contraseña")}>
            <Lock className="h-4 w-4" />
            Actualizar contraseña
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}

function SistemaTab() {
  const groups: { title: string; icon: LucideIcon; iconClassName: string; items: string[] }[] = [
    {
      title: "Administración del sistema",
      icon: Settings,
      iconClassName: "text-slate-500",
      items: ["Catálogos generales", "Configuración de módulos", "Parámetros de operación"],
    },
    {
      title: "Control de acceso",
      icon: Shield,
      iconClassName: "text-green-600",
      items: ["Gestión de roles", "Permisos por usuario", "Auditoría de cambios"],
    },
    {
      title: "Recursos y ayuda",
      icon: Users,
      iconClassName: "text-[#2F80ED]",
      items: ["Centro de ayuda", "Documentación técnica", "Soporte técnico"],
    },
  ];

  return (
    <section className={cn(cardClassName, "px-[22px] pt-5 pb-[22px] flex flex-col gap-4")}>
      <SectionTitle title="Sistema" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.title} className="rounded-2xl bg-[#F8FAFC] p-2">
            <div className="flex items-center gap-2 px-2.5 pt-2 pb-2.5 text-sm font-semibold text-slate-900">
              <g.icon className={cn("h-4 w-4", g.iconClassName)} />
              {g.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <li
                  key={item}
                  className="min-h-9 px-2.5 rounded-lg flex items-center justify-between text-[13px] text-slate-500 cursor-not-allowed">
                  {item}
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-base font-semibold tracking-[-0.01em] text-slate-900">{title}</div>
      {subtitle && <div className="text-[13px] text-slate-500">{subtitle}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-700">{label}</span>
      {children}
      {hint && (
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Info className="h-3 w-3" />
          {hint}
        </span>
      )}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,.15)] disabled:bg-slate-50 disabled:text-slate-500"
    />
  );
}

function PrimaryButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-10 px-4 rounded-lg bg-[#2F80ED] text-sm font-semibold text-white flex items-center gap-2 transition-colors hover:bg-[#1E6FDB] disabled:bg-[#BFDBFE] disabled:cursor-not-allowed">
      {children}
    </button>
  );
}

const ConfiguracionPage = () => (
  <Suspense>
    <ConfiguracionContent />
  </Suspense>
);

export default ConfiguracionPage;
