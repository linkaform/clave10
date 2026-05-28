import { CalendarDays, User, MessageSquare, FileText } from "lucide-react";

export function mapNotaList(raw: any, base: any) {
  const images = Array.isArray(raw?.note_pic) && raw.note_pic.length > 0
    ? raw.note_pic.map((f: any) => f.file_url).filter(Boolean)
    : ["/sin_imagen_rondines.png"];

  const isCerrado = raw?.note_status?.toLowerCase() === "cerrado";

  const comments = Array.isArray(raw?.note_comments)
    ? raw.note_comments
        .map((c: any) => {
          if (typeof c.note_comments === "string") return c.note_comments;
          if (Array.isArray(c.note_comments)) return c.note_comments.join(", ");
          return null;
        })
        .filter(Boolean)
    : [];

  return {
    ...base,
    id: raw?._id || "no-id",
    folio: raw?.folio || "S/F",
    visit_type: raw?.note_status || "",
    title: raw?.note || "Sin nota",
    description: raw?.created_by_name || "",
    images,
    status: isCerrado ? "cerrado" : "abierto",
    statusLabel: isCerrado ? "Cerrado" : "Abierto",
    badgesList: [
      {
        customClass: "bg-indigo-100 hover:bg-indigo-100 px-4 py-1 text-xs font-semibold text-indigo-600 rounded-xl border-0 shadow-none whitespace-nowrap",
        label: raw?.folio,
      },
      {
        isEstatus: true,
        label: isCerrado ? "Cerrado" : "Abierto",
        customClass: "",
      },
    ],
    detailsList: [
      { icon: <User className="h-3 w-3" />, label: "Creado por", value: raw?.created_by_name },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha apertura", value: raw?.note_open_date },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha creación", value: raw?.created_at },
      {
        icon: <MessageSquare className="h-3 w-3" />,
        label: "Comentarios",
        value: comments,
      },
      {
        icon: <FileText className="h-3 w-3" />,
        label: "Archivos",
        value: raw?.note_file?.length > 0
          ? raw.note_file.map((f: any) => f.file_name).join(", ")
          : "Sin archivos",
      },
    ],
    modalDetailsList: [
      { icon: <User className="h-3 w-3" />, label: "Creado por", value: raw?.created_by_name },
      { icon: <User className="h-3 w-3" />, label: "Email", value: raw?.created_by_email },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha apertura", value: raw?.note_open_date },
      { icon: <CalendarDays className="h-3 w-3" />, label: "Fecha creación", value: raw?.created_at },
      { icon: <MessageSquare className="h-3 w-3" />, label: "Comentarios", value: comments },
      {
        icon: <FileText className="h-3 w-3" />,
        label: "Archivos",
        value: raw?.note_file?.length > 0
          ? raw.note_file.map((f: any) => f.file_name).join(", ")
          : "Sin archivos",
      },
    ],
    rawData: raw,
    vehiculos: null,
    equipos: null,
  };
}