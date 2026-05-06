import React from 'react'
import { Printer } from "lucide-react"
import { PhotoGridActionButtons } from "@/components/Bitacoras/PhotoGrid/PhotoGridActionButtons"
import { BitacoraRondin } from './rondines/table'

interface RondinActionButtonsProps {
  rondin: BitacoraRondin
  handleImprimir: (rondin: BitacoraRondin) => void
}

export const RondinActionButtons = ({
  rondin,
  handleImprimir,
}: RondinActionButtonsProps) => {
  const iconClass = `p-1.5 rounded-full transition-all duration-200 bg-white/90 hover:bg-white shadow-sm border border-slate-100 cursor-pointer hover:shadow-md text-slate-700 hover:text-blue-600 active:scale-95`;

  return (
    <PhotoGridActionButtons
      actions={[
        <div
          key="print"
          className={iconClass}
          title="Imprimir rondín"
          onClick={() => handleImprimir(rondin)}
        >
          <Printer className="w-4 h-4" />
        </div>,
      ]}
    />
  );
};