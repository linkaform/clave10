"use client";
// F0-15 · Muestra de los modales de ligar y de notificar, con datos inventados.
// Las pantallas reales (ME-05, ME-11, CF-02, MX-03) pasan sus datos y guardan en onLigar / onEnviar.
import { useState, type ReactNode } from "react";
import { Bell, Link2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton, Campo, ChipTipo, Entrada, Modal, avisar } from "@/components/contratistas/ui";
import {
  ListaRequerimientos, ModalLigarContrato, ModalLigarEmpleados, ModalLigarRequerimientos, ModalNotificar,
  descripcionNotificar, motivoIncumplimiento, useResaltados,
  type ContratoLigar, type DestinatarioNotificar, type EmpleadoLigar, type RequerimientoLigar,
} from "@/components/contratistas/ligar";

const espera = (ms = 700) => new Promise((r) => setTimeout(r, ms));

const EMPLEADOS: EmpleadoLigar[] = [
  { id: "e1", nombre: "Ana Cantú", nss: "4318 92 1234 5", perfiles: ["Soldador", "Pintor"], contratos: [] },
  { id: "e2", nombre: "Luis Villarreal", nss: "1209 88 4410 2", perfiles: ["Electricista"], contratos: ["C-118"] },
  { id: "e3", nombre: "Sofía Elizondo", nss: "8812 90 0921 7", perfiles: ["Supervisor", "Topógrafo", "Andamiero", "Guardia", "Chofer"], contratos: ["C-118", "C-131"] },
  { id: "e4", nombre: "Carlos Salinas", nss: "5502 85 7781 1", perfiles: ["Operador de grúa"], contratos: [], ligado: true },
  { id: "e5", nombre: "Diana Rocha", nss: "3340 93 1290 4", perfiles: [], contratos: [] },
  { id: "e6", nombre: "Jorge Treviño", nss: "7781 79 3344 9", perfiles: ["Montacarguista", "Almacenista"], contratos: ["C-131"] },
  { id: "e7", nombre: "Laura Garza", nss: "2211 91 5566 3", perfiles: ["Ayudante general"], contratos: [], ligado: true },
  { id: "e8", nombre: "Pedro Ayala", nss: "9090 87 2121 6", perfiles: ["Plomero", "Soldador"], contratos: [] },
  { id: "e9", nombre: "María Leal", nss: "6655 94 8899 0", perfiles: ["Técnico en refrigeración"], contratos: ["C-120"] },
  { id: "e10", nombre: "Raúl Benavides", nss: "4433 82 1100 8", perfiles: ["Chofer"], contratos: [] },
];

const REQUERIMIENTOS: RequerimientoLigar[] = [
  { id: "r1", nombre: "Opinión de cumplimiento IMSS", vigencia: "Mensual · entrega el día 17", ambito: "Empresa", tipo: "Documento" },
  { id: "r2", nombre: "Opinión de cumplimiento SAT", vigencia: "Mensual · entrega el día 17", ambito: "Empresa", tipo: "Documento" },
  { id: "r3", nombre: "Registro REPSE", vigencia: "Vigente por 3 años", ambito: "Empresa", tipo: "Documento" },
  { id: "r4", nombre: "Póliza de responsabilidad civil", vigencia: "Vigente por 1 año", ambito: "Empresa", tipo: "Documento" },
  { id: "r5", nombre: "Constancia DC-3 de trabajos en altura", vigencia: "Vigente por 1 año", ambito: "Persona", tipo: "Documento" },
  { id: "r6", nombre: "Examen médico de ingreso", vigencia: "Aprobado válido por 6 meses", ambito: "Persona", tipo: "Examen" },
  { id: "r7", nombre: "Antidoping", vigencia: "Aprobado válido por 3 meses", ambito: "Persona", tipo: "Examen" },
  { id: "r8", nombre: "Inspección de EPP", vigencia: "Semanal · lunes", ambito: "Persona", tipo: "Inspección" },
  { id: "r9", nombre: "Tarjeta de circulación", vigencia: "Vigente por 1 año", ambito: "Equipo", tipo: "Documento" },
  { id: "r10", nombre: "Inspección pre-uso de montacargas", vigencia: "Diaria · cada 8 horas", ambito: "Equipo", tipo: "Inspección" },
  { id: "r11", nombre: "Verificación vehicular", vigencia: "Semestral", ambito: "Equipo", tipo: "Documento" },
];

const CONTRATOS: ContratoLigar[] = [
  { folio: "C-142", cliente: "Ternium México", servicio: "Mantenimiento industrial", nombre: "Paro de planta 2026", perfiles: ["Soldador", "Supervisor", "Andamiero"] },
  { folio: "C-150", cliente: "Cemex", servicio: "Limpieza industrial", nombre: "Limpieza de silos", perfiles: ["Ayudante general", "Supervisor"] },
  { folio: "C-155", cliente: "Vitro", servicio: "Montaje", nombre: "Línea de templado", perfiles: ["Operador de grúa", "Soldador", "Electricista"] },
];
const PERFILES_EMPLEADO = ["Soldador", "Pintor"];

const DESTINATARIOS: DestinatarioNotificar[] = [
  { id: "c1", razonSocial: "Lennox México, S. de R.L. de C.V.", representante: "Ana Cantú", correo: "acantu@lennox.mx", incumplimientos: 2 },
  { id: "c2", razonSocial: "Servicios Industriales del Norte", representante: "Luis Villarreal", correo: "lvillarreal@sinorte.mx", incumplimientos: 1 },
  { id: "c3", razonSocial: "Andamios Monterrey", representante: "Héctor Garza", correo: "hgarza@andamiosmty.mx", incumplimientos: 4 },
];
const PERIODO = "octubre 2026";

type Abierto = "empleados" | "requerimientos" | "alta" | "contrato" | "editar" | "notificar1" | "notificarN" | null;

export function MuestraLigar() {
  const [abierto, setAbierto] = useState<Abierto>(null);
  const cerrar = () => setAbierto(null);

  // Lo ligado vive en la pantalla: la muestra lo guarda aquí para ver el resaltado
  const [empleados, setEmpleados] = useState(EMPLEADOS);
  const [reqsServicio, setReqsServicio] = useState(["r1", "r3"]);
  const res = useResaltados();

  // Alta de servicio
  const [nombre, setNombre] = useState("");
  const [reqsAlta, setReqsAlta] = useState<string[]>([]);
  const [intento, setIntento] = useState(false);
  const abrirAlta = () => {
    setNombre("");
    setReqsAlta([]);
    setIntento(false);
    setAbierto("alta");
  };

  const notificar1 = DESTINATARIOS.slice(0, 1);

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
      <Caso
        titulo="Ligar empleados"
        texto="Buscador, filtro por contrato, seleccionar todos, ya ligados en gris al final y botón con conteo. Guarda con espera."
      >
        <Boton icono={<Link2 />} onClick={() => setAbierto("empleados")}>
          Ligar
        </Boton>
      </Caso>

      <Caso titulo="Ligar requerimientos" texto="Agrupados por ámbito con casilla de grupo y “n de m”. Lo recién ligado se resalta 2.7 s.">
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {reqsServicio.map((id) => (
            <li key={id}>
              <ChipTipo className={cn("transition-colors duration-300", res.resaltados.includes(id) && "bg-c10-acc-l text-c10-acc-h")}>
                {REQUERIMIENTOS.find((r) => r.id === id)?.nombre}
              </ChipTipo>
            </li>
          ))}
        </ul>
        <Boton icono={<Link2 />} onClick={() => setAbierto("requerimientos")}>
          Ligar Requerimientos
        </Boton>
      </Caso>

      <Caso titulo="Lista dentro de un alta" texto="La misma tabla en el formulario de Nuevo Servicio, con filtros por ámbito y tipo y su error.">
        <Boton variante="crear" onClick={abrirAlta}>
          Nuevo Servicio
        </Boton>
      </Caso>

      <Caso titulo="Ligar a un contrato" texto="Desde el empleado, en dos pasos: contrato (coincidencia de perfiles) y perfiles. También “Editar perfiles”.">
        <div className="flex flex-wrap gap-2">
          <Boton icono={<Link2 />} onClick={() => setAbierto("contrato")}>
            Ligar Contrato
          </Boton>
          <Boton variante="contorno" icono={<Pencil />} onClick={() => setAbierto("editar")}>
            Editar perfiles
          </Boton>
        </div>
      </Caso>

      <Caso titulo="Notificar incumplimiento" texto="Destinatarios, motivo prellenado y obligatorio. A uno (detalle por obligación) o a varios (texto general).">
        <div className="flex flex-wrap gap-2">
          <Boton icono={<Bell />} onClick={() => setAbierto("notificar1")}>
            A uno
          </Boton>
          <Boton variante="contorno" icono={<Bell />} onClick={() => setAbierto("notificarN")}>
            A varios
          </Boton>
        </div>
      </Caso>

      <ModalLigarEmpleados
        abierto={abierto === "empleados"}
        onCerrar={cerrar}
        objeto="Paro de planta 2026 · Ternium México"
        folio="C-142"
        empleados={empleados}
        onLigar={async (ids) => {
          await espera();
          setEmpleados((es) => es.map((e) => (ids.includes(e.id) ? { ...e, ligado: true } : e)));
        }}
      />

      <ModalLigarRequerimientos
        abierto={abierto === "requerimientos"}
        onCerrar={cerrar}
        destino="el servicio Limpieza industrial"
        requerimientos={REQUERIMIENTOS}
        ligados={reqsServicio}
        mensajeTodoLigado="Todos los requerimientos ya están ligados a este servicio"
        onLigar={(ids) => {
          setReqsServicio((r) => REQUERIMIENTOS.map((x) => x.id).filter((id) => r.includes(id) || ids.includes(id)));
          res.resaltar(ids);
        }}
      />

      <Modal
        abierto={abierto === "alta"}
        onCerrar={cerrar}
        titulo="Nuevo Servicio"
        ancho={720}
        alto={860}
        etiquetaGuardar="Crear Servicio"
        onGuardar={() => {
          setIntento(true);
          if (!nombre.trim() || !reqsAlta.length) return;
          avisar("Se creó el servicio");
          cerrar();
        }}
      >
        <Campo etiqueta="Nombre del servicio" obligatorio error={intento && !nombre.trim() ? "Escribe el nombre" : undefined}>
          <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Limpieza industrial" />
        </Campo>
        <ListaRequerimientos
          requerimientos={REQUERIMIENTOS}
          valor={reqsAlta}
          onCambio={setReqsAlta}
          error={intento && !reqsAlta.length ? "Selecciona al menos un requerimiento" : undefined}
        />
      </Modal>

      <ModalLigarContrato
        abierto={abierto === "contrato" || abierto === "editar"}
        onCerrar={cerrar}
        contratos={CONTRATOS}
        perfilesEmpleado={PERFILES_EMPLEADO}
        editar={abierto === "editar" ? { contrato: CONTRATOS[0], perfiles: ["Soldador"] } : undefined}
        onLigar={() => espera()}
      />

      <ModalNotificar
        abierto={abierto === "notificar1"}
        onCerrar={cerrar}
        descripcion={descripcionNotificar({ cuantos: 1, periodo: PERIODO })}
        destinatarios={notificar1}
        motivoInicial={motivoIncumplimiento({
          periodo: PERIODO,
          representante: notificar1[0].representante,
          obligaciones: [
            { nombre: "Opinión de cumplimiento IMSS", causa: "no se cargó" },
            { nombre: "Pago de cuotas IMSS", causa: "rechazado: el comprobante no corresponde al periodo" },
          ],
        })}
        onEnviar={() => espera()}
      />
      <ModalNotificar
        abierto={abierto === "notificarN"}
        onCerrar={cerrar}
        descripcion={descripcionNotificar({ cuantos: DESTINATARIOS.length, periodo: PERIODO })}
        destinatarios={DESTINATARIOS}
        motivoInicial={motivoIncumplimiento({ periodo: PERIODO })}
        onEnviar={() => espera()}
      />
    </div>
  );
}

function Caso({ titulo, texto, children }: { titulo: string; texto: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-c10-panel p-4">
      <span className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-c10-title">{titulo}</span>
        <span className="text-[13px] leading-snug text-c10-meta [text-wrap:pretty]">{texto}</span>
      </span>
      {children}
    </div>
  );
}
