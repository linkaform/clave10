import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  MinusCircle,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Ambulance,
  TreePalm,
  Thermometer,
  Footprints,
  Headphones
} from "lucide-react";
import AttendanceCarouselModal from "./AttendanceCarouselModal";
import { Tooltip } from "@/components/ui/tooltip";

type StatusType = "presente" |
  "retardo" |
  "falta" |
  "falta_por_retardo" |
  "dia_libre" |
  "sin_registro" |
  "cerrado" |
  "vacaciones" |
  "días_personales" |
  "enfermedad" |
  "vuelta_personal" |
  "accidente";

const statusConfig: Record<StatusType, { color: string; icon: JSX.Element; label: string }> = {
  presente: {
    color: "bg-green-500 text-white",
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Asistencia",
  },
  retardo: {
    color: "bg-blue-400 text-white",
    icon: <Clock className="w-4 h-4" />,
    label: "Retardo",
  },
  falta: {
    color: "bg-red-600 text-white",
    icon: <XCircle className="w-4 h-4" />,
    label: "Falta",
  },
  falta_por_retardo: {
    color: "bg-yellow-400 text-white",
    icon: <XCircle className="w-4 h-4" />,
    label: "Falta por retardo",
  },
  dia_libre: {
    color: "bg-gray-300 text-gray-600",
    icon: <CalendarOff className="w-4 h-4" />,
    label: "Día libre",
  },
  sin_registro: {
    color: "bg-gray-100 text-gray-400",
    icon: <MinusCircle className="w-4 h-4" />,
    label: "Sin registro",
  },
  cerrado: {
    color: "bg-gray-100 text-gray-400",
    icon: <LogOut className="w-4 h-4" />,
    label: "Cerrado",
  },
  vacaciones: {
    color: "bg-[#3B82F6] text-white",
    icon: <TreePalm className="w-4 h-4" />,
    label: "Vacaciones",
  },
  días_personales: {
    color: "bg-[#A855F7] text-white",
    icon: <Headphones className="w-4 h-4" />,
    label: "Días personales",
  },
  enfermedad: {
    color: "bg-[#EF4444] text-white",
    icon: <Thermometer className="w-4 h-4" />,
    label: "Enfermedad",
  },
  vuelta_personal: {
    color: "bg-[#F97316] text-white",
    icon: <Footprints className="w-4 h-4" />,
    label: "Vuelta personal",
  },
  accidente: {
    color: "bg-[#B91C1C] text-white",
    icon: <Ambulance className="w-4 h-4" />,
    label: "Accidente",
  },
};

interface EmployeeAttendance {
  employee_id: number;
  nombre: string;
  ubicacion: string;
  asistencia_mes: { status: StatusType; dia: number, closed?: boolean, ubicacion?: string, fecha_inicio?: string, fecha_cierre?: string }[];
  resumen: { asistencias: number; retardos: number; faltas: number };
}

interface SimpleAttendanceTableProps {
  data: EmployeeAttendance[];
  daysInMonth: number;
  groupByLocation?: boolean;
  timeframe?: "mes" | "semana";
  month?: number;
  year?: number;
  selectedStatus?: string[]; // <-- agrega esto
}

function getWeeks(daysInMonth: number, month: number, year: number) {
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    week.push(day);
    // Sunday (0) or last day of month
    if (date.getDay() === 0 || day === daysInMonth) {
      weeks.push(week);
      week = [];
    }
  }
  // Completa la última semana a 7 días
  if (weeks.length > 0 && weeks[weeks.length - 1].length < 7) {
    const lastWeek = weeks[weeks.length - 1];
    const missing = 7 - lastWeek.length;
    for (let i = 0; i < missing; i++) {
      lastWeek.push(null); // null para celdas vacías
    }
  }
  return weeks;
}

const statusPriority: Record<StatusType, number> = {
  accidente: 11,
  enfermedad: 10,
  vuelta_personal: 9,
  días_personales: 8,
  vacaciones: 7,
  presente: 6,
  retardo: 5,
  dia_libre: 4,
  falta_por_retardo: 3,
  falta: 2,
  sin_registro: 1,
  cerrado: 0,
};

export const SimpleAttendanceTable: React.FC<SimpleAttendanceTableProps> = ({
  data,
  daysInMonth,
  groupByLocation = false,
  timeframe = "mes",
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear(),
  selectedStatus = [], // <-- ¡Agrega aquí!
}) => {
  const [search, setSearch] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [searchUbicacion, setSearchUbicacion] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>("");
  const [filterDay, setFilterDay] = useState<number>(1);

  useEffect(() => {
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
    setFilterDay(isCurrentMonth ? today.getDate() : 1);
  }, [month, year]);

  // Filtra empleados por nombre
  const filteredData = useMemo(() => {
    let result = data;
    if (search.trim()) {
      result = result.filter(emp =>
        emp.nombre.toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    if (searchUbicacion.trim()) {
      result = result.filter(emp =>
        emp.ubicacion.toLowerCase().includes(searchUbicacion.trim().toLowerCase())
      );
    }
    return result;
  }, [data, search, searchUbicacion]);

  // 1. Process data for merging (resolving priorities) OR keep as is if grouping by location
  const preProcessedData = useMemo(() => {
    if (groupByLocation) return filteredData;

    const map = new Map<number, EmployeeAttendance>();

    filteredData.forEach(emp => {
      if (!map.has(emp.employee_id)) {
        // Inicializamos con los dias ya taggeados con la ubicacion actual
        const initializedDays = emp.asistencia_mes.map(d => ({ ...d, ubicacion: emp.ubicacion }));
        map.set(emp.employee_id, { ...emp, asistencia_mes: initializedDays });
      } else {
        const merged = map.get(emp.employee_id)!;
        emp.asistencia_mes.forEach(dayObj => {
          // Taggeamos el dia con la ubicacion actual antes de procesar
          const dayWithLoc = { ...dayObj, ubicacion: emp.ubicacion };

          const idx = merged.asistencia_mes.findIndex(d => d.dia === dayWithLoc.dia);
          if (idx === -1) {
            merged.asistencia_mes.push(dayWithLoc);
          } else {
            const mergedDay = merged.asistencia_mes[idx];
            // Resolve priority: Presente > Retardo > others
            const bestStatus =
              statusPriority[dayWithLoc.status] > statusPriority[mergedDay.status]
                ? dayWithLoc
                : mergedDay;
            merged.asistencia_mes[idx] = bestStatus;
          }
        });
      }
    });

    // Cleanup and Recalculate summaries after merge
    map.forEach(emp => {
      // Sort days
      emp.asistencia_mes.sort((a, b) => a.dia - b.dia);

      // Recalculate summary
      let asistencias = 0, retardos = 0, faltas = 0;
      emp.asistencia_mes.forEach(d => {
        if (d.status === "presente") asistencias++;
        else if (d.status === "retardo") retardos++;
        else if (d.status === "falta" || d.status === "falta_por_retardo") faltas++;
      });
      emp.resumen = { asistencias, retardos, faltas };
    });

    return Array.from(map.values());
  }, [filteredData, groupByLocation]);

  // 2. Apply status filter to the PRE-PROCESSED data
  const finalData = useMemo(() => {
    if (!selectedStatus || selectedStatus.length === 0) return preProcessedData;

    return preProcessedData.filter(emp => {
      // Check the specific day we are filtering on (filterDay)
      // Note: filterDay relies on the column being clicked. 
      // If we want to filter if *any* day matches, logic would differ, 
      // but usually this table filters based on the selected day column context?
      // Actually, looking at the UI, the Table header sets 'filterDay'.

      const dayObj = emp.asistencia_mes.find(d => d.dia === filterDay);
      const status = dayObj ? dayObj.status : "sin_registro";

      return selectedStatus.includes(status);
    });
  }, [preProcessedData, selectedStatus, filterDay]);

  // 3. If grouping by location, build the map from the FINAL data
  const locationMap = useMemo(() => {
    if (!groupByLocation) return new Map<string, EmployeeAttendance[]>();

    const map = new Map<string, EmployeeAttendance[]>();
    finalData.forEach(emp => {
      if (!map.has(emp.ubicacion)) map.set(emp.ubicacion, []);
      map.get(emp.ubicacion)!.push(emp);
    });
    return map;
  }, [finalData, groupByLocation]);

  // Semanas del mes
  const weeks = useMemo(() => getWeeks(daysInMonth, month, year), [daysInMonth, month, year]);

  // Posiciona en la semana actual al cambiar mes/año/timeframe
  useEffect(() => {
    if (timeframe === "semana") {
      const today = new Date();
      const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear();
      const currentDay = isCurrentMonth ? today.getDate() : 1;
      const idx = weeks.findIndex(week => week.includes(currentDay));
      setSelectedWeek(idx >= 0 ? idx : 0);
    }
  }, [month, year, timeframe, weeks]);

  // Días a mostrar según vista
  const daysToShow = timeframe === "semana" ? weeks[selectedWeek] : Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="w-full overflow-auto max-h-[90vh] border rounded-md shadow-sm mb-8">
      {timeframe === "semana" && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            className="p-2 rounded-full border bg-white shadow hover:bg-blue-50 transition disabled:opacity-50"
            disabled={selectedWeek === 0}
            onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="bg-blue-50 px-4 py-2 rounded-lg flex flex-col items-center border border-blue-200 min-w-[160px]">
            <span className="text-sm font-semibold text-blue-700">
              Semana {selectedWeek + 1}
            </span>
            <span className="text-xs text-gray-600">
              {daysToShow.filter(Boolean)[0]} - {daysToShow.filter(Boolean).slice(-1)[0]}
            </span>
          </div>
          <button
            className="p-2 rounded-full border bg-white shadow hover:bg-blue-50 transition disabled:opacity-50"
            disabled={selectedWeek === weeks.length - 1}
            onClick={() => setSelectedWeek(w => Math.min(weeks.length - 1, w + 1))}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {groupByLocation && (
              <th className="sticky left-0 top-0 bg-white z-30 p-2 border-b-2 border-gray-300 text-left min-w-[120px] w-[140px]">
                <div>
                  <span>Ubicación</span>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      placeholder=""
                      value={searchUbicacion}
                      onChange={e => setSearchUbicacion(e.target.value)}
                      className="w-full pl-2 pr-7 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                    />
                    {searchUbicacion && (
                      <button
                        onClick={() => setSearchUbicacion("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </th>
            )}
            <th
              className={`sticky ${groupByLocation ? "left-[120px]" : "left-0"} top-0 bg-white z-30 p-2 border-b-2 border-gray-300 text-left min-w-[180px] w-[200px]`}
            >
              <div>
                <span>Empleado</span>
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder=""
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-2 pr-7 py-1 border rounded text-sm focus:outline-none focus:ring focus:border-blue-300"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </th>
            {daysToShow.map((day, idx) => {
              if (!day) return <th key={idx} className="sticky top-0 z-20 bg-white p-2 border-b text-center"></th>;

              const date = new Date(year, month - 1, day);
              const dayOfWeek = date.getDay();
              const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isSelected = filterDay === day;

              return (
                <th
                  key={idx}
                  className={`sticky top-0 z-20 p-1 border-b-2 border-gray-300 text-center min-w-[32px] max-w-[36px] ${isWeekend ? 'bg-blue-50' : 'bg-white'} cursor-pointer hover:bg-gray-100 ${isSelected && selectedStatus.length > 0 ? '!bg-yellow-200' : ''}`}
                  onClick={() => setFilterDay(day)}
                >
                  <div className="text-xs font-bold">{day.toString().padStart(2, '0')}</div>
                  <div className="text-[10px]">{dayNames[dayOfWeek]}</div>
                </th>
              );
            })}
            <th className="sticky top-0 z-20 px-1 py-2 border-b-2 border-gray-300 text-center bg-white min-w-[28px] max-w-[32px] text-xs">R</th>
            <th className="sticky top-0 z-20 px-1 py-2 border-b-2 border-gray-300 text-center bg-white min-w-[28px] max-w-[32px] text-xs">F</th>
            <th className="sticky top-0 z-20 px-1 py-2 border-b-2 border-gray-300 text-center bg-white min-w-[28px] max-w-[32px] text-xs">A</th>
          </tr>
        </thead>
        <tbody>
          {groupByLocation
            ? [...locationMap.entries()]
              .sort((a, b) => {
                if (!a[0]) return 1;
                if (!b[0]) return -1;
                return a[0].localeCompare(b[0]);
              })
              .map(([ubicacion, empleados]) =>
                empleados.map((emp, empIdx) => (
                  <tr key={emp.employee_id} className={empIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {empIdx === 0 && (
                      <td
                        rowSpan={empleados.length}
                        className="sticky left-0 bg-white z-10 p-2 border-b font-semibold align-top"
                      >
                        {ubicacion}
                      </td>
                    )}
                    <td
                      className={`sticky left-[120px] bg-white z-10 p-2 border-b font-medium align-top min-w-[180px] w-[200px]`}
                    >
                      {emp.nombre}
                    </td>
                    {daysToShow.map((day, i) => {
                      const isTodayCol = day === filterDay && selectedStatus.length > 0;
                      if (!day) {
                        return <td key={i} className="p-1 border-b text-center bg-gray-100"></td>;
                      }
                      const dayObj = emp.asistencia_mes.find(d => d.dia === day);
                      const status = dayObj?.status || "sin_registro";
                      const config = statusConfig[status] || statusConfig["sin_registro"];
                      const isClosed = dayObj?.closed;
                      const usedIcon = isClosed ? statusConfig["cerrado"].icon : config.icon;
                      const fechaInicio = dayObj?.fecha_inicio?.substring(10, 16) || "Sin registrar";
                      const fechaFin = dayObj?.fecha_cierre?.substring(10, 16) || "Sin registrar";

                      const tooltipContent = (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                            <div className={`p-1 rounded-full ${config.color}`}>
                              {React.cloneElement(usedIcon as React.ReactElement, { className: "w-3 h-3" })}
                            </div>
                            <span className="text-sm font-bold text-gray-800">{config.label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <span className="text-gray-500">Inicio:</span>
                            <span className="font-medium text-gray-900">{fechaInicio}</span>
                            <span className="text-gray-500">Cierre:</span>
                            <span className="font-medium text-gray-900">{fechaFin}</span>
                          </div>
                        </div>
                      );

                      return (
                        <td key={i} className={`p-1 border-b text-center ${isTodayCol ? "bg-yellow-300" : ""}`}>
                          <Tooltip content={tooltipContent}>
                            <button
                              type="button"
                              className={`inline-flex items-center justify-center rounded-full w-7 h-7 ${config.color} transition-transform hover:scale-110 active:scale-95 shadow-sm`}
                              onClick={() => {
                                setSelectedUserId([emp.employee_id]);
                                setSelectedNames([emp.nombre]);
                                setSelectedDay(day);
                                setSelectedUbicacion(dayObj?.ubicacion || emp.ubicacion);
                                setModalOpen(true);
                              }}
                            >
                              {usedIcon}
                            </button>
                          </Tooltip>
                        </td>
                      );
                    })}
                    <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.retardos}</td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.faltas}</td>
                    <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.asistencias}</td>
                  </tr>
                ))
              )
            : finalData.map((emp, empIdx) => (
              <tr key={emp.employee_id} className={empIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td
                  className="sticky left-0 bg-white z-10 p-2 border-b font-medium align-top min-w-[180px] w-[200px]"
                >
                  {emp.nombre}
                </td>
                {daysToShow.map((day, i) => {
                  const isTodayCol = day === filterDay && selectedStatus.length > 0;
                  if (!day) {
                    return <td key={i} className="p-1 border-b text-center bg-gray-100"></td>;
                  }
                  const dayObj = emp.asistencia_mes.find(d => d.dia === day);
                  const status = dayObj?.status || "sin_registro";
                  const config = statusConfig[status] || statusConfig["sin_registro"];
                  const isClosed = dayObj?.closed;
                  const usedIcon = isClosed ? statusConfig["cerrado"].icon : config.icon;
                  const fechaInicio = dayObj?.fecha_inicio?.substring(10, 16) || "Sin registrar";
                  const fechaFin = dayObj?.fecha_cierre?.substring(10, 16) || "Sin registrar";

                  const tooltipContent = (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                        <div className={`p-1 rounded-full ${config.color}`}>
                          {React.cloneElement(usedIcon as React.ReactElement, { className: "w-3 h-3" })}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{config.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                        <span className="text-gray-500">Inicio:</span>
                        <span className="font-medium text-gray-900">{fechaInicio}</span>
                        <span className="text-gray-500">Cierre:</span>
                        <span className="font-medium text-gray-900">{fechaFin}</span>
                      </div>
                    </div>
                  );

                  return (
                    <td
                      key={i}
                      className={`p-1 border-b text-center ${isTodayCol ? "bg-yellow-300" : ""}`}
                    >
                      <Tooltip content={tooltipContent}>
                        <button
                          type="button"
                          className={`inline-flex items-center justify-center rounded-full w-7 h-7 ${config.color} transition-transform hover:scale-110 active:scale-95 shadow-sm`}
                          onClick={() => {
                            setSelectedUserId([emp.employee_id]);
                            setSelectedNames([emp.nombre]);
                            setSelectedDay(day);
                            setSelectedUbicacion(dayObj?.ubicacion || emp.ubicacion);
                            setModalOpen(true);
                          }}
                        >
                          {usedIcon}
                        </button>
                      </Tooltip>
                    </td>
                  );
                })}
                <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.retardos}</td>
                <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.faltas}</td>
                <td className="px-1 py-2 border-b border-gray-200 text-center font-semibold text-xs">{emp.resumen.asistencias}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <AttendanceCarouselModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userIds={selectedUserId}
        names={selectedNames}
        selectedDay={selectedDay ?? 1}
        ubicacion={selectedUbicacion}
        daysInMonth={daysInMonth}
      />
    </div>
  );
};