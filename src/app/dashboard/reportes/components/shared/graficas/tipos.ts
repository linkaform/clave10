// Especificación de gráficas: datos puros; ChartCard solo los pinta
export type TipLine = { t: string; col?: string };
export type Tip = { h: string; s?: string; tt?: string; l: TipLine[] };

export type Serie = { k: string; t: string; col: string };

export type HRow = { l: string; sub?: string; vals: number[]; cols?: string[]; mk?: number; tip?: Tip };
export type HCard = {
  kind: "h"; title: string; cap: string; series: Serie[]; rows: HRow[];
  fmt?: (v: number) => string; lw?: number; nota?: string; empty: boolean; emptyT?: string;
};

export type VBar = { k: string; v: number; col: string };
export type VCol = { x: string; bars: VBar[][]; tip?: Tip };
export type VCard = { kind: "v"; title: string; cap: string; cols: VCol[]; empty: boolean; emptyT?: string };

export type HeatCell = { v: number; bg: string; fg: string; dot: boolean; tip: Tip };
export type HeatCard = {
  kind: "heat"; title: string; cap: string; legend: { t: string; col: string; round?: boolean }[];
  hrs: string[]; rows: { l: string; cells: HeatCell[] }[]; empty: boolean; emptyT?: string;
};

export type LCard = { kind: "l"; title: string; cap: string; fmt: (v: number) => string; pts: { v: number; x: string; tip?: Tip }[]; empty: boolean; emptyT?: string };

export type Card = HCard | VCard | HeatCard | LCard;
