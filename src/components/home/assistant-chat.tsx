"use client";

import * as React from "react";
import {
  BotMessageSquare,
  Mic,
  Paperclip,
  RotateCcw,
  SendHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HomeCard } from "./home-card";

// Asistente "Pedro". No hay endpoint de IA todavía: respuestas fijas del diseño.
const CHIPS: [string, string][] = [
  ["Mis tareas", "Mis tareas"],
  ["Resumen", "Resumen del turno"],
  ["¿Quién está dentro?", "¿Quién sigue dentro?"],
  ["Incidencia", "Redactar incidencia"],
];

const LOCAL: Record<string, string> = {
  "Resumen del turno":
    "Así va tu turno:\n- **Entradas:** 23 registradas, 6 personas siguen dentro.\n- **Salidas:** 17 registradas.\n- **Incidencias:** 1 abierta.\n- **Fallas:** 1 en proceso.\n- **Próximo rondín:** 12:00.\n\n¿Quieres que prepare la **entrega de turno** con este resumen?",
  "¿Quién sigue dentro?":
    "Siguen dentro **6 personas**:\n- **Visitas (3):** Grupo Alfa, Logística Norte y Auditoría Interna.\n- **Contratistas (2):** área de calderas, con gafete vigente.\n- **Transportista (1):** Transportes Delta en andén 2.\n\nLa visita más antigua lleva **3 h 10 min** dentro. ¿Quieres que avise a su anfitrión?",
  "Redactar incidencia":
    "Con gusto. Para redactar la incidencia necesito:\n- **Qué pasó:** describe el hecho en una frase.\n- **Dónde:** área, caseta o andén.\n- **Hora:** aproximada si no la sabes exacta.\n- **Involucrados:** personas o vehículos, si aplica.\n\nCon eso preparo el texto para que solo lo **revises y lo guardes**.",
};

const MIS_TAREAS: Item[] = [
  { title: "Cambiar foco de la entrada principal", sub: "Falla · Caseta Principal · 12:00" },
  { title: "Reparar pluma de acceso 2", sub: "Falla · Acceso vehicular · 13:00" },
  { title: "Revisar cámara sin señal en andén 2", sub: "Falla · Andén 2 · 14:00" },
  { title: "Dar seguimiento a persona sin gafete", sub: "Incidencia · Andén 2 · 15:30" },
];

const FALLBACK =
  "Por ahora solo puedo ayudarte con las sugerencias de abajo. Muy pronto podrás preguntarme lo que quieras.";

type Item = { title: string; sub: string };
type Msg =
  | { role: "intro" }
  | { role: "user"; text: string }
  | { role: "bot"; text: string; items?: Item[] };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// "**negrita**" → segmentos con peso.
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((p, i) =>
        p.startsWith("**") ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

// Frase inicial, viñetas "- " y cierre, como en el diseño.
function BotText({ text }: { text: string }) {
  const lead: string[] = [];
  const bullets: string[] = [];
  const tail: string[] = [];
  text.split("\n").forEach((l) => {
    const s = l.trim();
    if (!s) return;
    const m = s.match(/^[-•*]\s+(.*)$/);
    if (m) bullets.push(m[1]);
    else (bullets.length ? tail : lead).push(s);
  });
  return (
    <>
      <div className="max-w-[94%] rounded-[14px] bg-slate-100 px-3 py-[9px] text-[13px] leading-[1.5] text-neutral-900 flex flex-col gap-1.5">
        {lead.length > 0 && <div><Rich text={lead.join(" ")} /></div>}
        {bullets.length > 0 && (
          <ul className="m-0 pl-4 list-disc flex flex-col gap-1">
            {bullets.map((b, i) => <li key={i}><Rich text={b} /></li>)}
          </ul>
        )}
      </div>
      {tail.length > 0 && (
        <div className="max-w-[94%] rounded-[14px] bg-slate-100 px-3 py-[9px] text-[13px] leading-[1.5] text-neutral-900">
          <Rich text={tail.join(" ")} />
        </div>
      )}
    </>
  );
}

function BotAvatar({ small }: { small?: boolean }) {
  return (
    <span className={cn("rounded-full bg-[#2F80ED] text-white flex items-center justify-center", small ? "h-[18px] w-[18px]" : "h-[30px] w-[30px]")}>
      <BotMessageSquare className={small ? "h-[11px] w-[11px]" : "h-4 w-4"} />
    </span>
  );
}

export function AssistantChat({
  userName,
  className,
}: {
  userName: string;
  className?: string;
}) {
  const [chat, setChat] = React.useState<Msg[]>([{ role: "intro" }]);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, busy]);

  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setChat((c) => [...c, { role: "user", text }]);
    setQ("");
    setBusy(true);
    await wait(LOCAL[text] || text === "Mis tareas" ? 1400 : 700);
    const answer: Msg =
      text === "Mis tareas"
        ? { role: "bot", text: `${userName}, tienes ${MIS_TAREAS.length} tareas pendientes en tu turno:`, items: MIS_TAREAS }
        : { role: "bot", text: LOCAL[text] ?? FALLBACK };
    setChat((c) => [...c, answer]);
    setBusy(false);
  };

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const hasUserMsg = chat.some((m) => m.role === "user");

  return (
    <HomeCard className={cn("min-h-[420px]", className)}>
      <div className="flex items-center gap-2.5 py-2.5 pl-4 pr-3.5 border-b border-slate-100">
        <span className="relative">
          <BotAvatar />
          <span className="absolute -right-px -bottom-px h-2.5 w-2.5 rounded-full bg-green-600 border-2 border-white" />
        </span>
        <span className="flex flex-col gap-px min-w-0">
          <span className="text-[15px] font-bold text-slate-900">Pedro</span>
          <span className="text-[11px] font-semibold text-green-600">En línea</span>
        </span>
        <span className="flex-1" />
        <button
          type="button"
          title="Nueva Conversación"
          aria-label="Nueva Conversación"
          onClick={() => {
            setChat([{ role: "intro" }]);
            setQ("");
          }}
          className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-blue-100 hover:text-[#2F80ED]">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 pt-2.5 pb-2 flex flex-col gap-2.5">
        <div className="text-center text-[11px] font-bold text-slate-600 first-letter:uppercase">{today}</div>
        {chat.map((m, i) => {
          const showName = m.role !== "user" && (i === 0 || chat[i - 1].role === "user");
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                m.role === "user" ? "items-end" : "items-start",
              )}>
              {showName && (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <BotAvatar small />
                  Pedro
                </span>
              )}
              {m.role === "intro" && (
                <div className="max-w-[94%] rounded-[14px] bg-slate-100 px-3 py-[9px] text-[13px] leading-[1.5] text-neutral-900">
                  Hola {userName}, ¿en qué puedo ayudarte?
                </div>
              )}
              {m.role === "user" && (
                <div className="max-w-[88%] rounded-[14px] bg-[#2F80ED] px-3 py-[9px] text-[13px] leading-[1.45] text-white whitespace-pre-wrap">
                  {m.text}
                </div>
              )}
              {m.role === "bot" && <BotText text={m.text} />}
              {m.role === "bot" && m.items && (
                <div className="w-full flex flex-col gap-1">
                  {m.items.map((it, j) => (
                    <div key={j} className="flex items-start gap-2 w-full px-[9px] py-[7px] rounded-lg border border-gray-200 bg-white">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <span className="flex-1 min-w-0 flex flex-col gap-px">
                        <span className="text-xs font-bold leading-[1.35] text-slate-900">{it.title}</span>
                        {it.sub && <span className="text-[11px] text-slate-500">{it.sub}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {busy && (
          <div className="self-start flex items-center gap-2">
            <span className="h-[30px] px-3 rounded-full bg-slate-100 flex items-center gap-[3px]">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="block h-[5px] w-[5px] rounded-full bg-slate-900 animate-bounce"
                  style={{ animationDelay: `${d * 0.15}s` }}
                />
              ))}
            </span>
            <span className="text-xs font-bold text-slate-500">Pensando...</span>
          </div>
        )}
      </div>

      {!hasUserMsg && (
        <div className="flex flex-wrap justify-end gap-1.5 px-3 pb-2">
          {CHIPS.map(([label, question]) => (
            <button
              key={label}
              type="button"
              onClick={() => ask(question)}
              className="h-[26px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-neutral-900 whitespace-nowrap transition-colors hover:border-[#2F80ED] hover:bg-blue-50 hover:text-[#2F80ED]">
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mx-3 mb-3 px-2.5 pt-2 pb-1 rounded-[14px] border-[1.5px] border-[#2F80ED] bg-white flex flex-col gap-0.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ask(q);
            }
          }}
          placeholder="Escribe tu mensaje a Pedro..."
          aria-label="Escribe tu mensaje"
          className="w-full h-[22px] p-0 border-0 bg-transparent text-[13px] text-neutral-900 outline-none"
        />
        <div className="flex items-center gap-2 text-slate-500">
          <button type="button" title="Adjuntar Foto" aria-label="Adjuntar Foto" className="h-6 w-6 flex items-center justify-center transition-colors hover:text-[#2F80ED]">
            <Paperclip className="h-4 w-4" />
          </button>
          <button type="button" title="Dictar Mensaje" aria-label="Dictar Mensaje" className="h-6 w-6 flex items-center justify-center transition-colors hover:text-[#2F80ED]">
            <Mic className="h-4 w-4" />
          </button>
          <span className="flex-1" />
          <button
            type="button"
            title="Enviar"
            aria-label="Enviar"
            onClick={() => ask(q)}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-blue-50 hover:text-[#2F80ED]",
              q.trim() ? "text-[#2F80ED]" : "text-slate-400",
            )}>
            <SendHorizontal className="h-[17px] w-[17px]" />
          </button>
        </div>
      </div>
    </HomeCard>
  );
}
