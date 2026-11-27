"use client";
// RG-02 · Paso 4 · Constancia de situación fiscal: subirla (u omitirla), leerla y revisar
// los datos extraídos y el domicilio fiscal. Diseño: registro.dc.html 217–301.
// La lectura real es de RG-03.
import { Campo, ChipEstado, Consejo, Entrada, Etiqueta } from "../ui";
import { ArchivoSubido, DatosExtraidos, LeyendoDocumento, Omitir, ZonaCarga, subirDocumento } from "./CargaDocumento";
import { CAMPOS_DOMICILIO, DOCUMENTO_VACIO, erroresCsf, leerCsf, type DatosCsf } from "./documentos";
import type { PasoProps } from "./PasosTipo";

export function PasoCsf({ datos, set, avanzar }: PasoProps) {
  const c = datos.csf;
  const subir = (archivo: File) => subirDocumento("csf", archivo, (f) => leerCsf(f, datos.persona), set);

  if (c.estado === "leyendo") return <LeyendoDocumento />;

  if (c.estado === "listo" && c.datos && c.archivo)
    return (
      <div className="flex flex-col gap-5">
        <DatosExtraidos />
        <FormCsf
          d={c.datos}
          moral={datos.persona === "moral"}
          onCambio={(p) => set((s) => ({ csf: { ...s.csf, datos: { ...s.csf.datos!, ...p } } }))}
        />
        <ArchivoSubido archivo={c.archivo} onCambiar={() => set({ csf: { ...DOCUMENTO_VACIO } })} />
      </div>
    );

  return (
    <div className="flex flex-col gap-3.5">
      <ZonaCarga titulo="Arrastra tu constancia de situación fiscal aquí" onArchivo={subir} error={c.error} />
      <Consejo>
        <strong className="font-semibold">Nota:</strong> descarga tu constancia en{" "}
        <a href="https://www.sat.gob.mx" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          sat.gob.mx
        </a>{" "}
        con tu RFC y contraseña. Si la omites, tendrás que capturar los datos a mano.
      </Consejo>
      <Omitir
        onClick={() => {
          set({ csf: { ...DOCUMENTO_VACIO, omitido: true } });
          avanzar();
        }}
      />
    </div>
  );
}

function FormCsf({ d, moral, onCambio }: { d: DatosCsf; moral: boolean; onCambio: (p: Partial<DatosCsf>) => void }) {
  const e = erroresCsf(d, moral ? "moral" : "fisica");
  const campo = (k: keyof DatosCsf) => ({
    value: d[k],
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => onCambio({ [k]: ev.target.value }),
  });

  return (
    <div className="flex flex-col gap-5">
      <Campo etiqueta={moral ? "Razón social" : "Nombre completo"} obligatorio error={e.razon}>
        <Entrada {...campo("razon")} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="RFC" obligatorio error={e.rfc}>
          <Entrada {...campo("rfc")} onChange={(ev) => onCambio({ rfc: ev.target.value.toUpperCase() })} />
        </Campo>
        <Campo etiqueta="Correo electrónico" obligatorio error={e.correo}>
          <Entrada type="email" {...campo("correo")} />
        </Campo>
      </div>

      <div className="flex flex-col gap-2">
        <Etiqueta>Estatus en el padrón</Etiqueta>
        <ChipEstado tono={d.estatus === "Activo" ? "success" : "neutral"} texto={d.estatus} className="self-start" />
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[15px] font-semibold text-c10-title">Domicilio fiscal</span>
        <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
          {CAMPOS_DOMICILIO.map((f) => (
            <Campo
              key={f.k}
              etiqueta={<span className="normal-case tracking-normal text-c10-meta">{f.etiqueta}</span>}
              className={f.ancho ? "sm:col-span-2" : undefined}
            >
              <Entrada {...campo(f.k)} />
            </Campo>
          ))}
        </div>
      </div>
    </div>
  );
}
