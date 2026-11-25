"use client";
// F0-13 · Muestra del panel del documento y del modal de revisión, contra los servicios
// (con NEXT_PUBLIC_CONTRATISTAS_MOCKS sin "0", contra los mocks de documentos).
import { useEffect, useState } from "react";
import { Eye, FileSearch } from "lucide-react";
import { Boton, Casilla, ChipEstado, avisar } from "@/components/contratistas/ui";
import { ModalRevisarDocumento, PanelDocumento, puedeRevisar } from "@/components/contratistas/documento";
import { ESTATUS_DOCUMENTO_TONO } from "@/mappers/contratistas.mapper";
import { getDocumento, listDocumentos } from "@/services/contratistas/documentos";
import type { Documento } from "@/types/contratistas";

export function MuestraDocumento() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [sel, setSel] = useState<Documento | null>(null);
  const [revisar, setRevisar] = useState<Documento | null>(null);
  const [cumplimiento, setCumplimiento] = useState(false);
  const [comoDueno, setComoDueno] = useState(false);

  const cargar = () =>
    listDocumentos({})
      .then((p) => setDocs(p.items))
      .catch((e) => avisar(`No se pudieron cargar los documentos: ${(e as Error).message}`, "error"));

  useEffect(() => {
    cargar();
  }, []);

  const abrir = (id: string) => {
    setSel(null);
    setAbierto(true);
    getDocumento(id)
      .then(setSel)
      .catch((e) => {
        setAbierto(false);
        avisar(`No se pudo abrir el documento: ${(e as Error).message}`, "error");
      });
  };

  const alCambiar = (doc: Documento) => {
    if (sel?.id === doc.id) setSel(doc);
    setDocs((ds) => ds.map((d) => (d.id === doc.id ? doc : d)));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        <Casilla marcada={cumplimiento} titulo="Variante cumplimiento" onCambio={setCumplimiento} />
        <span className="text-sm text-c10-label">Variante cumplimiento (Contratista / Subido por)</span>
        <Casilla marcada={comoDueno} titulo="Como dueño" onCambio={setComoDueno} />
        <span className="text-sm text-c10-label">Como dueño (Subir Nueva Versión)</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 shadow-[0_0_0_1px_var(--c10-line)]">
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-c10-title">
              {d.folio} · {d.nombre}
            </span>
            <ChipEstado texto={d.estatus} tono={ESTATUS_DOCUMENTO_TONO[d.estatus]} />
            <Boton variante="contorno" tam="sm" icono={<Eye />} onClick={() => abrir(d.id)}>
              Ver
            </Boton>
            {puedeRevisar(d) && (
              <Boton tam="sm" icono={<FileSearch />} onClick={() => setRevisar(d)}>
                Revisar
              </Boton>
            )}
          </li>
        ))}
      </ul>

      <PanelDocumento
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        documento={sel}
        variante={cumplimiento ? "cumplimiento" : "documento"}
        puedeSubirVersion={comoDueno || undefined}
        onCambio={alCambiar}
      />
      <ModalRevisarDocumento
        abierto={!!revisar}
        onCerrar={() => setRevisar(null)}
        documento={revisar}
        variante={cumplimiento ? "cumplimiento" : "documento"}
        onRevisado={alCambiar}
      />
    </div>
  );
}
