"use client";
// RG-02 · Paso 3 · Registro REPSE: subir el aviso (o omitirlo), leerlo y revisar los
// datos extraídos. Diseño: registro.dc.html 99–216. La lectura real es de RG-03.
import { useId } from "react";
import { Check } from "lucide-react";
import { Campo, ChipEstado, Consejo, Entrada, Etiqueta } from "../ui";
import { ArchivoSubido, DatosExtraidos, LeyendoDocumento, Omitir, ZonaCarga, subirDocumento } from "./CargaDocumento";
import { DOCUMENTO_VACIO, erroresRepse, leerRepse, mesesRestantes, type DatosRepse } from "./documentos";
import type { PasoProps } from "./PasosTipo";

export function PasoRepse({ datos, set, avanzar }: PasoProps) {
  const r = datos.repse;

  const subir = (archivo: File) => subirDocumento("repse", archivo, (f) => leerRepse(f, datos.persona), set);

  if (r.estado === "leyendo") return <LeyendoDocumento />;

  if (r.estado === "listo" && r.datos && r.archivo)
    return (
      <div className="flex flex-col gap-5">
        <DatosExtraidos />
        <FormRepse
          d={r.datos}
          moral={datos.persona === "moral"}
          onCambio={(p) => set((s) => ({ repse: { ...s.repse, datos: { ...s.repse.datos!, ...p } } }))}
        />
        <ArchivoSubido archivo={r.archivo} onCambiar={() => set({ repse: { ...DOCUMENTO_VACIO } })} />
      </div>
    );

  return (
    <div className="flex flex-col gap-3.5">
      <ZonaCarga titulo="Arrastra tu aviso de registro REPSE aquí" onArchivo={subir} error={r.error} />
      <Consejo>
        <strong className="font-semibold">Nota:</strong> ¿No tienes tu aviso de registro? Consúltalo en{" "}
        <a href="https://repse.stps.gob.mx" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          repse.stps.gob.mx
        </a>{" "}
        con tu RFC.
      </Consejo>
      <Omitir
        onClick={() => {
          set({ repse: { ...DOCUMENTO_VACIO, omitido: true } });
          avanzar();
        }}
      />
    </div>
  );
}

function FormRepse({ d, moral, onCambio }: { d: DatosRepse; moral: boolean; onCambio: (p: Partial<DatosRepse>) => void }) {
  const e = erroresRepse(d, moral ? "moral" : "fisica");
  const meses = mesesRestantes(d.fin);
  const idNombre = useId();
  const campo = (k: keyof DatosRepse) => ({
    value: d[k] as string,
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => onCambio({ [k]: ev.target.value }),
  });

  return (
    <div className="flex flex-col gap-5">
      <Campo etiqueta="Número de registro REPSE" obligatorio error={e.folio}>
        <Entrada {...campo("folio")} placeholder="Ej. AGN-2841/2024" />
      </Campo>

      <div className="flex flex-col gap-2">
        <Etiqueta>Vigencia del registro</Etiqueta>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta={<span className="normal-case tracking-normal text-c10-meta">Inicio de vigencia</span>}>
            <Entrada type="date" {...campo("inicio")} />
          </Campo>
          <Campo etiqueta={<span className="normal-case tracking-normal text-c10-meta">Fin de vigencia</span>}>
            <Entrada type="date" {...campo("fin")} min={d.inicio || undefined} />
          </Campo>
        </div>
        {meses !== null &&
          (meses < 0 ? (
            <ChipEstado tono="danger" texto="Vencido" className="self-start" />
          ) : (
            <ChipEstado tono="success" texto={meses === 1 ? "1 mes restante" : `${meses} meses restantes`} className="self-start" />
          ))}
      </div>

      {moral ? (
        <Campo etiqueta="Razón social" obligatorio error={e.razon}>
          <Entrada {...campo("razon")} placeholder="Ej. Grupo Insa Servicios Industriales, S.A. de C.V." />
        </Campo>
      ) : (
        <div role="group" aria-labelledby={idNombre} className="flex flex-col gap-2">
          <span id={idNombre}>
            <Etiqueta obligatorio>Nombre completo</Etiqueta>
          </span>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo etiqueta={<span className="normal-case tracking-normal text-c10-meta">Nombre(s)</span>} error={e.nombres}>
              <Entrada {...campo("nombres")} />
            </Campo>
            <Campo etiqueta={<span className="normal-case tracking-normal text-c10-meta">Primer apellido</span>} error={e.apellido1}>
              <Entrada {...campo("apellido1")} />
            </Campo>
            <Campo etiqueta={<span className="normal-case tracking-normal text-c10-meta">Segundo apellido</span>}>
              <Entrada {...campo("apellido2")} />
            </Campo>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Etiqueta>Actividades autorizadas ante la STPS</Etiqueta>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-c10-sunken px-1.5 text-[11px] font-semibold tabular-nums text-c10-secondary">
            {d.actividades.length}
          </span>
        </div>
        <ul className="flex flex-col divide-y divide-c10-line overflow-hidden rounded-xl shadow-[0_0_0_1px_var(--c10-line)]">
          {d.actividades.map((a) => (
            <li key={a.clave} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-c10-title">{a.nombre}</span>
                <span className="text-xs tabular-nums text-c10-meta">Clave {a.clave}</span>
              </span>
              <Check className="size-4 shrink-0 text-green-600" strokeWidth={2.5} aria-label="Autorizada" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
