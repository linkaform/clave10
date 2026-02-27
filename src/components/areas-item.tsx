/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from "react";
import { Areas } from "@/hooks/useCreateAccessPass";
import { MapPin } from "lucide-react";

interface AreasItemProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  index: number;
  onDelete: () => void;
  areaRaw: Areas;
  loadingCatAreas?: boolean;
  catAreas?: { id: string; name: string; category: string }[];
  updateArea?: (value: string, fieldName: string) => void;
}

interface AreaConNoteBooth {
  note_booth?: string;
  commentario_area?: string;
}

function formatArea(a: Areas | AreaConNoteBooth) {
  if ('nombre_area' in a) {
    return a;
  } else if ('note_booth' in a) {
    return { nombre_area: a.note_booth || "", commentario_area: a.commentario_area || "" };
  }
}

const AreasItem: React.FC<AreasItemProps> = ({ onDelete, areaRaw }) => {
  const [open, setOpen] = useState(false);
  const area = formatArea(areaRaw);

  return (
    <div className="bg-gray-100 mt-2 hover:bg-blue-50 transition-colors">
      <div
        className="flex justify-between items-center p-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-semibold">{area?.nombre_area}</span>
        </div>
        <div className="flex items-center gap-2">
        
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-200 hover:bg-red-300 text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3">
          <span className="font-bold text-sm">Comentario: </span>
          <span className="text-sm text-gray-600">
            {area?.commentario_area || "Sin comentario"}
          </span>
        </div>
      )}
    </div>
  );
};

export default AreasItem;