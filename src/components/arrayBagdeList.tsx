"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ArrayBadgeListProps {
  values: string[];
  max?: number;
  badgeClass?: string;
  tooltipTitle?: string;
}


function TooltipMore({ values, max, tooltipTitle }: { values: string[]; max: number; tooltipTitle: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          variant="secondary"
          className="bg-blue-100 hover:bg-blue-200 text-blue-600 border-0 rounded-md px-2 py-0.5 text-xs font-semibold shadow-none cursor-pointer">
          +{values.length - max} más
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 bg-slate-800 border-slate-700"
        onClick={(e) => e.stopPropagation()}>
        <p className="font-semibold mb-2 text-slate-300 uppercase tracking-wider text-[10px]">
          {tooltipTitle} ({values.length})
        </p>
        <div 
          className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto"
          onWheel={(e) => e.stopPropagation()}>
          {values.map((val, i) => (
            <span key={i} className="bg-slate-700 text-white px-2 py-0.5 rounded-md text-xs">
              {val}
            </span>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
export function ArrayBadgeList({
  values,
  max = 15,
  badgeClass = "bg-slate-100 hover:bg-slate-200 text-slate-600 border-0 rounded-md px-2 py-0.5 text-xs font-normal shadow-none",
  tooltipTitle = "Todos",
}: ArrayBadgeListProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {values.slice(0, max).map((val, i) => (
        <Badge key={i} variant="secondary" className={badgeClass}>
          {val}
        </Badge>
      ))}
      {values.length > max && (
        <TooltipMore values={values} max={max} tooltipTitle={tooltipTitle} />
      )}
    </div>
  );
}