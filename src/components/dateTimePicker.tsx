"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";

type ClockMode = "hour" | "minute";

interface TimeValue {
  hour: number;
  minute: number;
}

interface ClockPickerProps {
  hour: number;
  minute: number;
  onChange: (value: TimeValue) => void;
  minuteStep?: 1 | 15;
}

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  allowPast?: boolean;
  showTime?: boolean;
  placeholder?: string;
  minuteStep?: 1 | 15;
}

function ClockPicker({ hour, minute, onChange, minuteStep = 1 }: ClockPickerProps) {
  const [mode, setMode] = useState<ClockMode>("hour");
  const clockRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef<boolean>(false);

  const SIZE = 220;
  const CENTER = SIZE / 2;
  const HOUR_R = 74;
  const MINUTE_R = 74;
  const INNER_HOUR_R = 48;

  const toAngle = (val: number, max: number): number => (val / max) * 360 - 90;

  const getHandAngle = (): number => {
    if (mode === "hour") return toAngle(hour % 12 === 0 ? 12 : hour % 12, 12);
    return toAngle(minute, 60);
  };

  const snapMinute = useCallback(
    (raw: number): number => {
      if (minuteStep === 15) {
        return Math.round(raw / 15) * 15 % 60;
      }
      return raw;
    },
    [minuteStep]
  );

  const angleToValue = useCallback(
    (cx: number, cy: number): void => {
      if (!clockRef.current) return;
      const rect = clockRef.current.getBoundingClientRect();
      const x = cx - rect.left - CENTER;
      const y = cy - rect.top - CENTER;
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      const dist = Math.sqrt(x * x + y * y);

      if (mode === "hour") {
        const raw = Math.round(angle / 30) % 12 || 12;
        const isInner = dist < 58;
        const val = isInner ? (raw === 12 ? 0 : raw + 12) : raw;
        onChange({ hour: val, minute });
      } else {
        const raw = Math.round(angle / 6) % 60;
        onChange({ hour, minute: snapMinute(raw) });
      }
    },
    [mode, hour, minute, onChange, CENTER, snapMinute]
  );

  const handlePointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>): void => {
      if (!isDragging.current || !clockRef.current) return;
      angleToValue(e.clientX, e.clientY);
    },
    [angleToValue]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): void => {
      if (!clockRef.current) return;
      angleToValue(e.clientX, e.clientY);
      if (mode === "hour") setTimeout(() => setMode("minute"), 200);
    },
    [angleToValue, mode]
  );

  useEffect(() => {
    const up = (): void => { isDragging.current = false; };
    window.addEventListener("pointerup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("touchend", up);
    };
  }, []);

  const handAngle = getHandAngle();
  const handRad = (handAngle * Math.PI) / 180;
  const r = mode === "hour"
    ? (hour === 0 || hour > 12 ? INNER_HOUR_R : HOUR_R)
    : MINUTE_R;
  const handX = CENTER + r * Math.cos(handRad);
  const handY = CENTER + r * Math.sin(handRad);

  const hours: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  const hoursInner: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];

  const minutes: number[] = minuteStep === 15
    ? [0, 15, 30, 45]
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const numPos = (i: number, total: number, rr: number): { x: number; y: number } => {
    const a = ((i / total) * 360 - 90) * (Math.PI / 180);
    return { x: CENTER + rr * Math.cos(a), y: CENTER + rr * Math.sin(a) };
  };

  const isActiveHour = (v: number): boolean => hour === v;
  const isActiveMinute = (v: number): boolean => minute === v;
  const fmt = (n: number): string => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 text-3xl font-light select-none">
        <button type="button" onClick={() => setMode("hour")}
          className={cn("px-2.5 py-0.5 rounded-lg transition-all duration-200",
            mode === "hour" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-400 hover:text-slate-600"
          )}>
          {fmt(hour)}
        </button>
        <span className="text-slate-300">:</span>
        <button type="button" onClick={() => setMode("minute")}
          className={cn("px-2.5 py-0.5 rounded-lg transition-all duration-200",
            mode === "minute" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-400 hover:text-slate-600"
          )}>
          {fmt(minute)}
        </button>
      </div>

      <div className="relative select-none">
        <svg ref={clockRef} width={SIZE} height={SIZE} className="cursor-pointer touch-none"
          onClick={handleClick}
          onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
            isDragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={handlePointer}
        >
          <circle cx={CENTER} cy={CENTER} r={CENTER - 3} fill="#F1F5F9" />
          <line x1={CENTER} y1={CENTER} x2={handX} y2={handY} stroke="#2563EB" strokeWidth={2} strokeLinecap="round" />
          <circle cx={CENTER} cy={CENTER} r={3} fill="#2563EB" />
          <circle cx={handX} cy={handY} r={15} fill="#2563EB" opacity={0.15} />
          <circle cx={handX} cy={handY} r={8} fill="#2563EB" />

          {mode === "hour" && (
            <>
              {hours.map((h: number, i: number) => {
                const pos = numPos(i, 12, HOUR_R);
                const active = isActiveHour(h);
                return (
                  <g key={h}>
                    {active && <circle cx={pos.x} cy={pos.y} r={13} fill="#2563EB" />}
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={11} fontWeight={active ? "600" : "400"} fill={active ? "white" : "#475569"}>
                      {h}
                    </text>
                  </g>
                );
              })}
              {hoursInner.map((h: number, i: number) => {
                const pos = numPos(i, 12, INNER_HOUR_R);
                const active = isActiveHour(h);
                return (
                  <g key={`inner-${h}`}>
                    {active && <circle cx={pos.x} cy={pos.y} r={11} fill="#2563EB" />}
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={9} fontWeight={active ? "600" : "400"} fill={active ? "white" : "#94A3B8"}>
                      {h === 0 ? "00" : h}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {mode === "minute" && (
            <>
              {minutes.map((m: number, i: number) => {
                const pos = numPos(i, minutes.length, MINUTE_R);
                const active = isActiveMinute(m);
                return (
                  <g key={m}>
                    {active && <circle cx={pos.x} cy={pos.y} r={13} fill="#2563EB" />}
                    <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                      fontSize={10} fontWeight={active ? "600" : "400"} fill={active ? "white" : "#475569"}>
                      {String(m).padStart(2, "0")}
                    </text>
                  </g>
                );
              })}
              {minuteStep === 1 && Array.from({ length: 60 }, (_: unknown, i: number) => {
                if (i % 5 === 0) return null;
                const a = ((i / 60) * 360 - 90) * (Math.PI / 180);
                const r1 = MINUTE_R - 12;
                const r2 = MINUTE_R - 7;
                return (
                  <line key={`tick-${i}`}
                    x1={CENTER + r1 * Math.cos(a)} y1={CENTER + r1 * Math.sin(a)}
                    x2={CENTER + r2 * Math.cos(a)} y2={CENTER + r2 * Math.sin(a)}
                    stroke="#CBD5E1" strokeWidth={1.5} strokeLinecap="round"
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>

      <p className="text-xs text-slate-400">
        {mode === "hour" ? "Selecciona la hora" : "Selecciona los minutos"}
      </p>
    </div>
  );
}

export default function DateTimePicker({
  date,
  setDate,
  allowPast = false,
  showTime = true,
  placeholder,
  minuteStep = 1,
}: DateTimePickerProps) {
  const now = new Date();
  const defaultPlaceholder = showTime ? "Selecciona fecha y hora" : "Selecciona una fecha";

  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<Date | undefined>(date);
  const [hour, setHour] = useState<number>(date ? date.getHours() : now.getHours());
  const [minute, setMinute] = useState<number>(date ? date.getMinutes() : now.getMinutes());
  const [view, setView] = useState<"calendar" | "clock">("calendar");
  const timeSelected = useRef<boolean>(!!date);

  const commitAndClose = useCallback((day: Date | undefined, h: number, m: number): void => {
    if (!day) return;
    const d = new Date(day);
    d.setHours(showTime ? h : 0, showTime ? m : 0, 0, 0);
    setDate(d);
  }, [setDate, showTime]);

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && selected) {
      const h = timeSelected.current ? hour : now.getHours();
      const m = timeSelected.current ? minute : now.getMinutes();
      commitAndClose(selected, h, m);
    }
    if (!nextOpen) setView("calendar");
    setOpen(nextOpen);
  };

  const handleDaySelect = (day: Date | undefined): void => {
    if (!day) return;
    setSelected(day);
    if (showTime) {
      setView("clock");
    } else {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      setDate(d);
      setOpen(false);
    }
  };

  const handleTimeChange = ({ hour: h, minute: m }: TimeValue): void => {
    timeSelected.current = true;
    setHour(h);
    setMinute(m);
  };

  const handleClear = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setDate(undefined);
    setSelected(undefined);
    timeSelected.current = false;
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  const fmt = (n: number): string => String(n).padStart(2, "0");

  const dateLabel: string = selected
    ? format(selected, "EEEE d 'de' MMMM", { locale: es })
    : "Selecciona una fecha";

  const triggerLabel: string = date
    ? showTime
      ? format(date, "dd / MM / yyyy  -  HH:mm")
      : format(date, "dd / MM / yyyy")
    : (placeholder ?? defaultPlaceholder);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative flex items-center w-full">
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center justify-between w-full",
              "h-10 pl-3 pr-9 rounded-md border border-input bg-background",
              "text-sm transition-colors",
              "hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
              !date && "text-muted-foreground"
            )}
          >
            <span className={cn("tabular-nums tracking-wide", !date && "text-slate-400")}>
              {triggerLabel}
            </span>
            <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
          </button>
        </PopoverTrigger>

        {date && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 flex items-center justify-center h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors"
            aria-label="Limpiar fecha"
          >
            <X className="h-3 w-3 text-slate-600" />
          </button>
        )}
      </div>

      <PopoverContent
        className="w-fit p-0 rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
        align="start"
        sideOffset={6}
      >
        <div className="bg-blue-600 px-5 py-3 text-white">
          <p className="text-[10px] uppercase tracking-widest opacity-75 font-medium">
            {view === "calendar" ? "Fecha" : "Hora"}
          </p>
          <div className="flex items-end justify-between mt-0.5 gap-6">
            <button type="button" onClick={() => setView("calendar")}
              className={cn("text-xl font-semibold leading-tight transition-opacity capitalize",
                view === "clock" ? "opacity-60 hover:opacity-100" : "opacity-100"
              )}>
              {dateLabel}
            </button>
            {showTime && (
              <button type="button" onClick={() => setView("clock")}
                className={cn("text-xl font-light tabular-nums transition-opacity whitespace-nowrap",
                  view === "calendar" ? "opacity-60 hover:opacity-100" : "opacity-100"
                )}>
                {fmt(hour)}:{fmt(minute)}
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-white">
          {view === "calendar" ? (
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              locale={es}
              disabled={allowPast ? undefined : { before: new Date() }}
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                caption: "flex justify-center items-center relative px-7 mb-1",
                caption_label: "text-xs font-semibold text-slate-700 capitalize",
                nav: "flex items-center gap-1",
                nav_button: cn(
                  "h-6 w-6 rounded-full flex items-center justify-center",
                  "text-slate-500 hover:bg-slate-100 transition-colors"
                ),
                nav_button_previous: "absolute left-0",
                nav_button_next: "absolute right-0",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-slate-400 text-[10px] font-medium w-8 text-center pb-1",
                row: "flex mt-0.5",
                cell: cn("relative p-0 text-center text-xs w-8 h-8", "focus-within:relative focus-within:z-20"),
                day: cn("h-8 w-8 rounded-full font-normal text-xs flex items-center justify-center",
                  "hover:bg-blue-50 hover:text-blue-700 transition-colors"),
                day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white font-semibold",
                day_today: "border-2 border-blue-400 font-semibold text-blue-600",
                day_disabled: "text-slate-200 cursor-not-allowed hover:bg-transparent hover:text-slate-200",
                day_outside: "text-slate-300",
              }}
            />
          ) : (
            <ClockPicker hour={hour} minute={minute} onChange={handleTimeChange} minuteStep={minuteStep} />
          )}
        </div>
        {view === "clock" && (
          <div className="flex items-center px-3 pb-3 bg-white">
            <button type="button" onClick={() => setView("calendar")}
              className="text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded hover:bg-slate-100">
              ← Volver
            </button>
            <div className="flex-1" />
            <p className="text-xs text-slate-400">Se guardará al cerrar</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}