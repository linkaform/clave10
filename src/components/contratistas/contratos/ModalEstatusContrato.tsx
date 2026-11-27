"use client";
// ME-10 · Confirmar pausar, reanudar o cancelar un contrato. Textos del diseño
// (plataforma.dc.html, ctoPause / ctoCancel ~5570 y cfmOpen ~3614). El diseño no
// pide motivo, pero change_status_contrato (ME-14) lo exige y lo guarda en el historial.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AreaTexto, Campo, Modal, avisar } from "@/components/contratistas/ui";
import { changeStatusContrato } from "@/services/contratistas";
import type { Contrato } from "@/types/contratistas";

export type AccionEstatus = "pausar" | "reanudar" | "cancelar";

const TEXTOS: Record<AccionEstatus, { titulo: string; descripcion: string; etiqueta: string; exito: string; error: string }> = {
  pausar: {
    titulo: "¿Pausar contrato?",
    descripcion: "Se suspenderán los accesos del personal y las obligaciones periódicas hasta que lo reanudes.",
    etiqueta: "Pausar Contrato",
    exito: "Se pausó el contrato",
    error: "No se pudo pausar el contrato",
  },
  reanudar: {
    titulo: "¿Reanudar contrato?",
    descripcion: "El personal recuperará sus accesos y se reactivarán las obligaciones periódicas.",
    etiqueta: "Reanudar Contrato",
    exito: "Se reanudó el contrato",
    error: "No se pudo reanudar el contrato",
  },
  cancelar: {
    titulo: "¿Cancelar contrato?",
    descripcion: "Esta acción no se puede deshacer. Se dará de baja al personal asignado y el contrato pasará a Cancelado.",
    etiqueta: "Cancelar Contrato",
    exito: "Se canceló el contrato",
    error: "No se pudo cancelar el contrato",
  },
};

const ESTATUS_MANUAL = { pausar: "Pausado", cancelar: "Cancelado", reanudar: null } as const;

export function ModalEstatusContrato({
  contrato, accion, onCerrar,
}: { contrato: Contrato; accion: AccionEstatus; onCerrar: () => void }) {
  const qc = useQueryClient();
  const t = TEXTOS[accion];
  const [motivo, setMotivo] = useState("");
  const [intento, setIntento] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setIntento(true);
    if (!motivo.trim()) return;
    setGuardando(true);
    try {
      const nuevo = await changeStatusContrato(contrato.id, { estatus_manual: ESTATUS_MANUAL[accion], motivo: motivo.trim() });
      qc.setQueryData(["contratistas", "contrato", contrato.id], nuevo);
      qc.invalidateQueries({ queryKey: ["contratistas", "contrato-historial", contrato.id] });
      qc.invalidateQueries({ queryKey: ["contratistas", "contratos"] });
      avisar(t.exito);
      onCerrar();
    } catch (e) {
      avisar(e instanceof Error && e.message ? e.message : t.error, "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto onCerrar={onCerrar} titulo={t.titulo} descripcion={t.descripcion} ancho={460}
      onGuardar={guardar} guardando={guardando} etiquetaGuardar={t.etiqueta}
    >
      <div className="rounded-[10px] bg-c10-panel px-3.5 py-3 text-sm font-medium leading-snug text-c10-text">
        #{contrato.folio} · {contrato.objeto}
      </div>
      <Campo etiqueta="Motivo" obligatorio error={intento && !motivo.trim() && "Escribe el motivo"}>
        <AreaTexto
          value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} autoFocus
          placeholder="Queda en el historial de modificaciones"
        />
      </Campo>
    </Modal>
  );
}
