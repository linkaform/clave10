import { format } from "date-fns";

export interface CampoComprobante {
  label: string;
  value: string;
}

export interface ComprobanteOptions {
  titulo: string;
  badge?: string;
  footerText?: string;
  filenamePrefix: string;
  campos: CampoComprobante[];
}

export const generarYDescargarComprobante = ({
  titulo,
  badge = "✓ REGISTRADO",
  footerText = "Documento generado automáticamente",
  filenamePrefix,
  campos,
}: ComprobanteOptions) => {
  const W = 800;
  const PADDING = 40;
  const COL = (W - PADDING * 2) / 2 - 10;

  // ── helpers de medida ──
  const tmpCanvas = document.createElement("canvas");
  const tmpCtx = tmpCanvas.getContext("2d")!;

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string): string[] => {
    ctx.font = font;
    const words = (text || "—").split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const FONT_LABEL = "bold 11px system-ui, sans-serif";
  const FONT_VALUE = "13px system-ui, sans-serif";
  const LINE_H = 18;
  const CELL_PAD = 14;
  const CELL_GAP = 10;

  // Pre-calcular alturas de cada celda
  const cellHeights = campos.map(({ value }) => {
    const lines = wrapText(tmpCtx, value || "—", COL - CELL_PAD * 2, FONT_VALUE);
    return CELL_PAD * 2 + LINE_H + lines.length * LINE_H + 4;
  });

  // Layout en 2 columnas
  interface Cell { campo: CampoComprobante; x: number; y: number; h: number }
  const cells: Cell[] = [];
  let yL = 0, yR = 0;
  campos.forEach((campo, i) => {
    const h = cellHeights[i];
    if (yL <= yR) {
      cells.push({ campo, x: PADDING, y: yL, h });
      yL += h + CELL_GAP;
    } else {
      cells.push({ campo, x: PADDING + COL + 20, y: yR, h });
      yR += h + CELL_GAP;
    }
  });

  const HEADER_H = 110;
  const FOOTER_H = 60;
  const GRID_H = Math.max(yL, yR);
  const H = HEADER_H + GRID_H + FOOTER_H + PADDING;

  // ── dibujar ──
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;   // retina
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Fondo
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  // Header
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#1d4ed8");
  grad.addColorStop(1, "#3b82f6");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, HEADER_H - 10, [0, 0, 24, 24]);
  ctx.fill();

  // Ícono (simple)
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(PADDING, 18, 52, 52, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(PADDING + 12, 28, 28, 28);
  ctx.beginPath();
  ctx.moveTo(PADDING + 12, 34);
  ctx.lineTo(PADDING + 40, 34);
  ctx.stroke();

  // Título
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText(titulo, PADDING + 64, 38);
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")} hrs`, PADDING + 64, 58);

  // Badge
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.roundRect(W - PADDING - 90, 24, 90, 28, 8);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(badge, W - PADDING - 45, 43);
  ctx.textAlign = "left";

  // ── Celdas ──
  const OY = HEADER_H + 14;

  cells.forEach(({ campo, x, y, h }) => {
    const absY = y + OY;

    // Sombra suave
    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x, absY, COL, h, 10);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Borde izquierdo accent
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.roundRect(x, absY + 8, 3, h - 16, 2);
    ctx.fill();

    // Label
    ctx.fillStyle = "#94a3b8";
    ctx.font = FONT_LABEL;
    ctx.fillText(campo.label.toUpperCase(), x + CELL_PAD, absY + CELL_PAD + 11);

    // Value (multiline)
    ctx.fillStyle = "#1e293b";
    ctx.font = FONT_VALUE;
    const lines = wrapText(ctx, campo.value || "—", COL - CELL_PAD * 2, FONT_VALUE);
    lines.forEach((line, li) => {
      ctx.fillText(line, x + CELL_PAD, absY + CELL_PAD + 11 + LINE_H + li * LINE_H);
    });

    // Dash si vacío
    if (!campo.value) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "italic 13px system-ui, sans-serif";
      ctx.fillText("Sin información", x + CELL_PAD, absY + CELL_PAD + 11 + LINE_H);
    }
  });

  // ── Footer ──
  const footerY = HEADER_H + GRID_H + PADDING + 10;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(PADDING, footerY, W - PADDING * 2, 1);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(footerText, W / 2, footerY + 20);
  ctx.textAlign = "left";

  // ── Descargar ──
  const link = document.createElement("a");
  link.download = `${filenamePrefix}_${format(new Date(), "yyyyMMdd_HHmm")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

export interface IncidenciaComprobanteData {
  folio?: string;
  categoria?: string;
  sub_categoria?: string;
  incidente?: string;
  incidencia?: string;
  fecha_hora_incidencia?: string;
  ubicacion_incidencia?: string;
  area_incidencia?: string;
  reporta_incidencia?: string;
  prioridad_incidencia?: string;
  notificacion_incidencia?: string;
  comentario_incidencia?: string;
}

export const generarComprobanteIncidencia = (data: IncidenciaComprobanteData) => {
  generarYDescargarComprobante({
    titulo: "Comprobante de Incidencia",
    badge: "✓ REGISTRADA",
    footerText: "Sistema de Incidencias  ·  Documento generado automáticamente",
    filenamePrefix: data.folio ? `comprobante_incidencia_${data.folio}` : "comprobante_incidencia",
    campos: [
      { label: "Folio", value: data.folio ?? "" },
      { label: "Categoría", value: data.categoria ?? "" },
      { label: "Subcategoría", value: data.sub_categoria ?? "" },
      { label: "Incidente", value: data.incidente || data.incidencia || "" },
      { label: "Fecha y hora", value: data.fecha_hora_incidencia ?? "" },
      { label: "Ubicación", value: data.ubicacion_incidencia ?? "" },
      { label: "Área", value: data.area_incidencia ?? "" },
      { label: "Reporta", value: data.reporta_incidencia ?? "" },
      { label: "Prioridad", value: data.prioridad_incidencia ?? "" },
      { label: "Notificación", value: data.notificacion_incidencia ?? "" },
      { label: "Descripción", value: data.comentario_incidencia ?? "" },
    ],
  });
};
