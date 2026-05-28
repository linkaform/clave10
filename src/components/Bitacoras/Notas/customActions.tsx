import React from "react";
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons";
import { Check, Pencil } from "lucide-react";
import { ListaNota } from "@/components/table/notas/lista-notas/lista-notas-columns";
import { CloseNoteModal } from "@/components/modals/close-note-modal";
import { EditNoteModal } from "@/components/modals/edit-note-modal";

interface NotasActionButtonsProps {
  nota: ListaNota;
}

export const NotasActionButtons = ({ nota }: NotasActionButtonsProps) => {
  const isCerrado = nota.note_status === "cerrado";

  const iconClass = (disabled: boolean) =>
    `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 ${
      disabled
        ? "text-slate-300 cursor-not-allowed opacity-50"
        : "cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95"
    }`;

  return (
    <PhotoGridActionButtons
      actions={[
        !isCerrado ? (
          <CloseNoteModal key="cerrar" title="Cerrar Nota" note={nota}>
            <div className={iconClass(false)} title="Cerrar nota">
              <Check className="w-4 h-4 " />
            </div>
          </CloseNoteModal>
        ) : null,

        !isCerrado ? (
          <EditNoteModal key="editar" title="Editar Nota" note={nota}>
            <div className={iconClass(false)} title="Editar nota">
              <Pencil className="w-4 h-4" />
            </div>
          </EditNoteModal>
        ) : null,
      ].filter(Boolean)}
    />
  );
};