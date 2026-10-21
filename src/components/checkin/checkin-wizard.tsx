"use client";

import * as React from "react";
import { Building2, Loader2, LogIn, LogOut, Search, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Imagen } from "@/components/upload-Image";
import { CheckInCamera } from "./checkin-camera";
import { cn } from "@/lib/utils";
import {
  useCheckIn,
  useCheckInMutations,
  useCheckInWizard,
  useLugaresCheckIn,
  useRolesCheckIn,
} from "@/hooks/useCheckIn";
import { useAsistencia } from "@/hooks/useAsistencia";

const MOTIVOS: [string, string][] = [
  ["incapacidad", "Incapacidad"],
  ["vacaciones", "Vacaciones"],
  ["permiso", "Permiso"],
  ["falta", "Falta"],
  ["otro", "Otro"],
];

type Lugar = { ubicacion: string; caseta: string };

// Solo en desarrollo: permite seguir sin foto (p. ej. sin cámara en el navegador).
const PERMITE_SIN_FOTO = process.env.NODE_ENV !== "production";

// Asistente de Check In (Área → Foto y rol) y de Check Out (foto), como el diseño.
export function CheckInWizard() {
  const { mode, close } = useCheckInWizard();
  const open = mode !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[560px] p-0 gap-0 rounded-[20px] border-0 overflow-hidden [&>button:last-child]:hidden">
        {mode === "asistencia" && <AsistenciaPrimero onDone={close} />}
        {mode === "checkin" && <CheckInFlow onDone={close} />}
        {mode === "checkout" && <CheckOutFlow onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}

// El Check In depende de la jornada: quien está Ausente primero marca su asistencia.
function AsistenciaPrimero({ onDone }: { onDone: () => void }) {
  const { setEstatus, isSaving } = useAsistencia();
  const open = useCheckInWizard((s) => s.open);

  return (
    <>
      <WizardHeader title="Registra tu asistencia" subtitle="Para hacer Check In tu estatus debe ser Disponible." onClose={onDone} />
      <div className="px-6 pt-1 pb-4">
        <Hint>¿Registrar tu asistencia y hacer Check In?</Hint>
      </div>
      <WizardFooter>
        <SecondaryButton onClick={onDone}>Cancelar</SecondaryButton>
        <PrimaryButton
          disabled={isSaving}
          onClick={() => setEstatus("disponible", { onSuccess: () => open("checkin") })}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Registrar y hacer Check In
        </PrimaryButton>
      </WizardFooter>
    </>
  );
}

function CheckInFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [lugar, setLugar] = React.useState<Lugar | null>(null);
  const [esSuplente, setEsSuplente] = React.useState(false);
  const [suplente, setSuplente] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [foto, setFoto] = React.useState<Imagen[]>([]);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [sinFoto, setSinFoto] = React.useState(false);
  const [rol, setRol] = React.useState("");

  const lugares = useLugaresCheckIn(true);
  const roles = useRolesCheckIn(true);
  const { checkIn } = useCheckInMutations();

  const opciones = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return (lugares.data ?? [])
      .flatMap((l) => l.casetas.map((c) => ({ ubicacion: l.ubicacion, ...c })))
      .filter((o) => !q || `${o.caseta} ${o.ubicacion}`.toLowerCase().includes(q));
  }, [lugares.data, query]);

  // Con una sola opción se preselecciona.
  React.useEffect(() => {
    if (!lugar && opciones.length === 1) setLugar({ ubicacion: opciones[0].ubicacion, caseta: opciones[0].caseta });
  }, [opciones, lugar]);

  const suplenteOk = !esSuplente || (suplente.trim().length > 2 && !!motivo);
  const paso1Ok = !!lugar && suplenteOk;
  const paso2Ok = (foto.length > 0 || sinFoto) && !subiendoFoto;

  const submit = () => {
    if (!lugar) return;
    checkIn.mutate(
      {
        ubicacion: lugar.ubicacion,
        caseta: lugar.caseta,
        rol: rol || undefined,
        suplente: esSuplente ? suplente.trim() : undefined,
        motivo: esSuplente ? motivo : undefined,
        foto,
      },
      { onSuccess: onDone },
    );
  };

  return (
    <>
      <WizardHeader
        title="Check In"
        subtitle={step === 1 ? "Selecciona el área donde harás Check In." : "Toma tu fotografía y elige tu rol."}
        step={step}
        onClose={onDone}
        right={
          step === 1 && (
            <button
              type="button"
              role="switch"
              aria-checked={esSuplente}
              onClick={() => setEsSuplente((s) => !s)}
              className="flex items-center gap-2 text-[13px] text-slate-600 select-none">
              Suplente
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  esSuplente ? "bg-[#2F80ED]" : "bg-slate-300",
                )}>
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]",
                    esSuplente ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
            </button>
          )
        }
      />

      {step === 1 ? (
        <div className="flex flex-col min-h-0">
          {esSuplente && (
            <div className="px-6 pt-1 pb-4 flex flex-col gap-3 border-b border-slate-100">
              <input
                value={suplente}
                onChange={(e) => setSuplente(e.target.value)}
                placeholder="Tu nombre completo"
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,.15)]"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[13px] text-slate-500">Motivo:</span>
                {MOTIVOS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMotivo(value)}
                    className={cn(
                      "h-7 px-3 rounded-full border text-[13px] transition-colors",
                      motivo === value
                        ? "border-[#2F80ED] bg-[#EFF6FF] text-[#2F80ED] font-semibold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="px-6 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar área o ubicación"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,.15)]"
              />
            </div>
          </div>
          <div className="px-6 pb-4 h-[min(420px,50vh)] overflow-y-auto flex flex-col gap-2">
            {lugares.isLoading && (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {lugares.isError && (
              <Empty title="No se pudieron cargar tus áreas" text={(lugares.error as Error).message} />
            )}
            {!lugares.isLoading && !lugares.isError && opciones.length === 0 && (
              <Empty
                title={query ? "Sin resultados" : "No tienes áreas configuradas"}
                text={query ? "Prueba con otro nombre." : "Pide a tu administrador que te asigne una ubicación."}
              />
            )}
            {opciones.map((o) => {
              const sel = lugar?.ubicacion === o.ubicacion && lugar?.caseta === o.caseta;
              return (
                <button
                  key={`${o.ubicacion}|${o.caseta}`}
                  type="button"
                  onClick={() => setLugar({ ubicacion: o.ubicacion, caseta: o.caseta })}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors",
                    sel ? "border-[1.5px] border-[#2F80ED] bg-[#EFF6FF]" : "border border-slate-200 hover:bg-slate-50",
                  )}>
                  <span
                    className={cn(
                      "h-[18px] w-[18px] flex-shrink-0 rounded-full border-2 flex items-center justify-center",
                      sel ? "border-[#2F80ED]" : "border-slate-300",
                    )}>
                    {sel && <span className="h-2 w-2 rounded-full bg-[#2F80ED]" />}
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-slate-900 truncate">{o.caseta}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 truncate">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      {o.ocupantes.length === 0
                        ? "Sin nadie en turno"
                        : o.ocupantes.map((p) => p.nombre).join(", ")}
                    </span>
                  </span>
                  <span className="flex-shrink-0 h-[22px] px-2 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {o.ubicacion}
                  </span>
                </button>
              );
            })}
          </div>
          <WizardFooter>
            <SecondaryButton onClick={onDone}>Cancelar</SecondaryButton>
            <PrimaryButton disabled={!paso1Ok} onClick={() => setStep(2)}>
              Siguiente
            </PrimaryButton>
          </WizardFooter>
        </div>
      ) : (
        <div className="flex flex-col min-h-0">
          <div className="px-6 pt-2 pb-4 max-h-[min(520px,60vh)] overflow-y-auto flex flex-col gap-4">
            <Hint>Capture una fotografía de su uniforme completo antes de hacer Check In.</Hint>
            <CheckInCamera nombre="checkin" foto={foto} onChange={setFoto} onUploadingChange={setSubiendoFoto} />
            <SinFotoToggle value={sinFoto} onChange={setSinFoto} />
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-700">
                Rol <span className="font-normal normal-case text-slate-400">(opcional)</span>
              </span>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-neutral-900 outline-none focus:border-[#2F80ED]">
                <option value="">{roles.isLoading ? "Cargando roles…" : "Selecciona un rol"}</option>
                {(roles.data ?? []).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {lugar && (
              <div className="text-[13px] text-slate-500">
                Harás Check In en <span className="font-semibold text-slate-700">{lugar.ubicacion} · {lugar.caseta}</span>
                {esSuplente && <> como suplente ({suplente.trim()})</>}.
              </div>
            )}
          </div>
          <WizardFooter>
            <SecondaryButton onClick={() => setStep(1)}>Atrás</SecondaryButton>
            <PrimaryButton disabled={!paso2Ok || checkIn.isPending} onClick={submit}>
              {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Check In
            </PrimaryButton>
          </WizardFooter>
        </div>
      )}
    </>
  );
}

function CheckOutFlow({ onDone }: { onDone: () => void }) {
  const { checkIn: abierto } = useCheckIn();
  const { checkOut } = useCheckInMutations();
  const [foto, setFoto] = React.useState<Imagen[]>([]);
  const [subiendoFoto, setSubiendoFoto] = React.useState(false);
  const [sinFoto, setSinFoto] = React.useState(false);
  const [comentario, setComentario] = React.useState("");

  return (
    <>
      <WizardHeader
        title="Check Out"
        subtitle={abierto ? `${abierto.ubicacion} · ${abierto.caseta}` : "Sin Check In abierto"}
        onClose={onDone}
      />
      <div className="px-6 pt-2 pb-4 max-h-[min(560px,65vh)] overflow-y-auto flex flex-col gap-4">
        <Hint>Capture una fotografía de su uniforme completo antes de hacer Check Out.</Hint>
        <CheckInCamera nombre="checkout" foto={foto} onChange={setFoto} onUploadingChange={setSubiendoFoto} />
        <SinFotoToggle value={sinFoto} onChange={setSinFoto} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[.04em] text-slate-700">Comentario</span>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none resize-none focus:border-[#2F80ED]"
          />
        </label>
      </div>
      <WizardFooter>
        <SecondaryButton onClick={onDone}>Cancelar</SecondaryButton>
        <button
          type="button"
          disabled={!abierto || (foto.length === 0 && !sinFoto) || subiendoFoto || checkOut.isPending}
          onClick={() =>
            checkOut.mutate({ foto, comentario: comentario.trim() || undefined }, { onSuccess: onDone })
          }
          className="h-10 px-4 rounded-lg bg-[#DC2626] text-sm font-semibold text-white flex items-center gap-2 transition-colors hover:bg-[#B91C1C] disabled:bg-[#FCA5A5] disabled:cursor-not-allowed">
          {checkOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Check Out
        </button>
      </WizardFooter>
    </>
  );
}

function SinFotoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  if (!PERMITE_SIN_FOTO) return null;
  return (
    <label className="flex items-center gap-2 text-[13px] text-amber-700 cursor-pointer select-none">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      Continuar sin foto (solo pruebas, no aparece en producción)
    </label>
  );
}

function WizardHeader({
  title,
  subtitle,
  step,
  right,
  onClose,
}: {
  title: string;
  subtitle: string;
  step?: 1 | 2;
  right?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="px-6 pt-5 pb-3 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500">{subtitle}</DialogDescription>
        </div>
        {right}
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="h-8 w-8 flex-shrink-0 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center transition-colors hover:bg-slate-200">
          <X className="h-4 w-4" />
        </button>
      </div>
      {step && (
        <div className="flex gap-1.5">
          {[1, 2].map((n) => (
            <span
              key={n}
              className={cn("h-1 w-6 rounded-full", n <= step ? "bg-[#2F80ED]" : "bg-slate-200")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WizardFooter({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">{children}</div>;
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

function SecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
      {children}
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-[13px] text-[#1E6FDB]">
      {children}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 p-6 text-center">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="text-[13px] text-slate-500">{text}</div>
    </div>
  );
}
