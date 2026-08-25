"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react";
import { cn, errorMsj } from "@/lib/utils";
import { getPassTransportista, createVisitTransportista } from "@/services/endpoints";
import { toast } from "sonner";
import {
  type UnidadItem,
  type MaterialCarga,
  emptyUnidad,
  emptyMaterial,
  resolveColorSwatch,
  UnidadEditorCard,
  serializeUnidades,
} from "@/components/transportista/agregar-unidad-modal";

interface Props {
  open: boolean;
  onClose: () => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

function MiniField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn("text-xs text-gray-700 leading-snug", mono && "font-mono", !value && "text-gray-300 italic")}>
        {value || "Sin información"}
      </p>
    </div>
  );
}

export function RegistrarLlegadaPaseModal({ open, onClose }: Props) {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [numDePase, setNumDePase] = useState<string | null>(null);
  const [paseInfo, setPaseInfo] = useState<{
    folio: string | null;
    tipoOperacionLabel: string;
  } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const [tipoOperacion, setTipoOperacion] = useState<"Entrega" | "Recolección">("Entrega");
  const [transportista, setTransportista] = useState("");
  const [proveedorCliente, setProveedorCliente] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [marcaVehiculo, setMarcaVehiculo] = useState("");
  const [modeloVehiculo, setModeloVehiculo] = useState("");
  const [colorVehiculo, setColorVehiculo] = useState("");
  const [placa, setPlaca] = useState("");
  const [noEconomico, setNoEconomico] = useState("");
  const [conductor, setConductor] = useState("");
  const [noLicencia, setNoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [rfcConductor, setRfcConductor] = useState("");
  const [acompanante, setAcompanante] = useState("");

  // Remolques / contenedores — mismo modelo de unidades que "Nuevo Acceso
  // Transportista" y el detalle de transportista, para que capturar carga
  // (y decidir si va a un contenedor o un remolque) se vea y funcione igual
  // sin importar por cuál de los dos flujos entró el transportista.
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);
  const [showAgregarUnidad, setShowAgregarUnidad] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnidadItem | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleUnit = (id: string) =>
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetForm = () => {
    setBusqueda("");
    setBuscando(false);
    setNumDePase(null);
    setPaseInfo(null);
    setConfirmando(false);
    setTipoOperacion("Entrega");
    setTransportista("");
    setProveedorCliente("");
    setOrdenCompra("");
    setTipoVehiculo("");
    setMarcaVehiculo("");
    setModeloVehiculo("");
    setColorVehiculo("");
    setPlaca("");
    setNoEconomico("");
    setConductor("");
    setNoLicencia("");
    setVigenciaLicencia("");
    setRfcConductor("");
    setAcompanante("");
    setUnidades([]);
    setShowAgregarUnidad(false);
    setEditingUnit(null);
    setExpandedUnits(new Set());
  };

  const handleBuscar = async () => {
    const id = busqueda.trim();
    if (!id) return;
    setBuscando(true);
    try {
      const result = await getPassTransportista(id);
      if (!result?.success || !result?.response?.data?._id) {
        toast.error("No se encontró ningún pase con ese folio/id.");
        return;
      }
      const d = result.response.data as Partial<{
        _id: string;
        folio: string;
        estado_transportista: string;
        tipo_de_operacion: string;
        empresa_transportista: string;
        proveedor_cliente_material: string;
        orden_de_compra: string;
        vehiculo_tipo_unidad: string;
        vehiculo_marca: string;
        vehiculo_modelo: string;
        vehiculo_color: string;
        vehiculo_placas: string;
        vehiculo_no_economico: string;
        conductor_nombre: string;
        conductor_no_licencia: string;
        conductor_vigencia: string;
        conductor_rfc: string;
        ayudante_nombre: string;
        contenedores: { numero?: string; sello?: string; tipo?: string }[];
        materiales: {
          tipo?: string; cantidad?: string; volumen?: string; peso?: string;
          producto?: string; lote?: string; no_referencia?: string; contenedor?: string;
        }[];
      }>;

      if (d.estado_transportista === "completado") {
        toast.error("Este pase ya fue registrado anteriormente en la bitácora.");
        return;
      }

      const esRecoleccion = (d.tipo_de_operacion || "").startsWith("recoleccion");
      setTipoOperacion(esRecoleccion ? "Recolección" : "Entrega");
      setTransportista(d.empresa_transportista || "");
      setProveedorCliente(d.proveedor_cliente_material || "");
      setOrdenCompra(d.orden_de_compra || "");
      setTipoVehiculo(d.vehiculo_tipo_unidad || "");
      setMarcaVehiculo(d.vehiculo_marca || "");
      setModeloVehiculo(d.vehiculo_modelo || "");
      setColorVehiculo(d.vehiculo_color || "");
      setPlaca(d.vehiculo_placas || "");
      setNoEconomico(d.vehiculo_no_economico || "");
      setConductor(d.conductor_nombre || "");
      setNoLicencia(d.conductor_no_licencia || "");
      setVigenciaLicencia(d.conductor_vigencia || "");
      setRfcConductor(d.conductor_rfc || "");
      setAcompanante(d.ayudante_nombre || "");

      // El pase captura contenedores (lista formal, grupo_contenedores) y
      // materiales (cada uno con su propio texto libre de "contenedor") por
      // separado, sin ligarlos entre sí — se convierten a unidades aquí para
      // que el guardia pueda revisar/corregir esa asignación con el mismo
      // editor que usa "Nuevo Acceso Transportista".
      const contenedoresPase = (d.contenedores || []).filter((c) => c.numero || c.sello || c.tipo);
      const materialesPase = d.materiales || [];

      const unidadesIniciales: UnidadItem[] = contenedoresPase.map((c) => {
        const u = emptyUnidad();
        u.config = "remolque_contenedor";
        u.contenedor = { ...u.contenedor, tipo: c.tipo || "", noSello: c.sello || "", noContenedor: c.numero || "", materiales: [] };
        return u;
      });

      const buscarUnidadPorContenedor = (nombre: string) =>
        unidadesIniciales.find(
          (u) => u.config === "remolque_contenedor" && u.contenedor.noContenedor.trim().toLowerCase() === nombre.trim().toLowerCase(),
        );

      let unidadGeneral: UnidadItem | null = null;

      materialesPase.forEach((m) => {
        const materialCarga: MaterialCarga = {
          ...emptyMaterial(),
          producto: m.producto || m.tipo || "",
          lote: m.lote || "",
          cantEsperada: m.cantidad || "",
          peso: m.peso || "",
          volumen: m.volumen || "",
        };
        const contenedorNombre = (m.contenedor || "").trim();
        if (contenedorNombre) {
          let target = buscarUnidadPorContenedor(contenedorNombre);
          if (!target) {
            target = emptyUnidad();
            target.config = "remolque_contenedor";
            target.contenedor = { ...target.contenedor, noContenedor: contenedorNombre, materiales: [] };
            unidadesIniciales.push(target);
          }
          target.contenedor.materiales.push(materialCarga);
        } else {
          if (!unidadGeneral) {
            unidadGeneral = emptyUnidad();
            unidadGeneral.remolque = { ...unidadGeneral.remolque, materiales: [] };
            unidadesIniciales.push(unidadGeneral);
          }
          unidadGeneral.remolque.materiales.push(materialCarga);
        }
      });

      // Toda unidad que se haya quedado sin ningún material (ej. un
      // contenedor del pase que ningún material referenció) empieza con un
      // renglón vacío, igual que hace emptyUnidad() por defecto.
      const unidadesConMaterialesPorDefecto = unidadesIniciales.map((u) => ({
        ...u,
        remolque: { ...u.remolque, materiales: u.remolque.materiales.length ? u.remolque.materiales : [emptyMaterial()] },
        contenedor: { ...u.contenedor, materiales: u.contenedor.materiales.length ? u.contenedor.materiales : [emptyMaterial()] },
      }));

      setUnidades(unidadesConMaterialesPorDefecto);
      setExpandedUnits(new Set(unidadesConMaterialesPorDefecto.map((u) => u.id)));

      setNumDePase(id);
      setPaseInfo({
        folio: d.folio ?? null,
        tipoOperacionLabel: esRecoleccion ? "Recolección" : "Entrega",
      });
    } catch (err) {
      const textMsj = errorMsj(err instanceof Error ? err.message : err);
      toast.error(textMsj?.text || "No se pudo buscar el pase.");
    } finally {
      setBuscando(false);
    }
  };

  const handleConfirmar = async () => {
    if (!numDePase) return;
    setConfirmando(true);
    try {
      const { remolques, contenedores, materiales } = serializeUnidades(unidades);
      const payload = {
        num_de_pase: numDePase,
        tipo_operacion: tipoOperacion,
        vehiculo: {
          transportista: transportista || null,
          tipo_vehiculo: tipoVehiculo || null,
          placa: placa || null,
          no_economico: noEconomico || null,
          marca: marcaVehiculo || null,
          modelo: modeloVehiculo || null,
          color: colorVehiculo || null,
        },
        conductor: {
          nombre: conductor || null,
          no_licencia: noLicencia || null,
          vigencia_licencia: vigenciaLicencia || null,
          rfc: rfcConductor || null,
          acompanante: acompanante || null,
        },
        embarque: {
          proveedor_cliente: proveedorCliente || null,
          no_orden_compra: ordenCompra || null,
        },
        remolques,
        contenedores,
        materiales,
      };

      const result = await createVisitTransportista(payload);
      const hasError = !result?.success || (result?.response?.data?.status_code ?? 0) >= 400;
      if (hasError) {
        const textMsj = errorMsj(result);
        toast.error(textMsj?.text || "No se pudo registrar la llegada.");
        return;
      }
      const bitacoraId = result?.response?.data?.json?.id;
      toast.success("Llegada registrada correctamente.");
      resetForm();
      onClose();
      if (bitacoraId) router.push(`/dashboard/accesos/transportista/${bitacoraId}`);
    } catch {
      toast.error("No se pudo registrar la llegada.");
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { resetForm(); onClose(); }
      }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Registrar llegada de pase</DialogTitle>

        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-800 leading-tight">
              Registrar llegada de pase
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Liga un pase de entrada ya creado con su llegada física
            </p>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[65vh] px-6 py-5 space-y-5">
          {!numDePase ? (
            <div className="flex items-center gap-2">
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBuscar();
                  }
                }}
                placeholder="Folio o ID del pase de entrada"
                className="rounded-xl border-gray-200"
                autoFocus
              />
              <Button
                type="button"
                disabled={buscando || !busqueda.trim()}
                onClick={handleBuscar}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shrink-0">
                {buscando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Pase <span className="font-semibold">{paseInfo?.folio || numDePase}</span>
                    {" — "}{paseInfo?.tipoOperacionLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-green-700 hover:text-green-900 underline underline-offset-2">
                  Buscar otro
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Empresa transportista" value={transportista} onChange={setTransportista} />
                <Field label="Proveedor / Cliente" value={proveedorCliente} onChange={setProveedorCliente} />
                <Field label="Orden de compra" value={ordenCompra} onChange={setOrdenCompra} />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest pt-1">
                <Truck className="w-3.5 h-3.5" /> Vehículo
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Tipo de unidad" value={tipoVehiculo} onChange={setTipoVehiculo} />
                <Field label="Marca" value={marcaVehiculo} onChange={setMarcaVehiculo} />
                <Field label="Modelo" value={modeloVehiculo} onChange={setModeloVehiculo} />
                <Field label="Color" value={colorVehiculo} onChange={setColorVehiculo} />
                <Field label="Placas" value={placa} onChange={setPlaca} />
                <Field label="No. económico" value={noEconomico} onChange={setNoEconomico} />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest pt-1">
                <User className="w-3.5 h-3.5" /> Conductor
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" value={conductor} onChange={setConductor} />
                <Field label="No. de licencia" value={noLicencia} onChange={setNoLicencia} />
                <Field label="Vigencia" value={vigenciaLicencia} onChange={setVigenciaLicencia} />
                <Field label="RFC" value={rfcConductor} onChange={setRfcConductor} />
                <Field label="Ayudante" value={acompanante} onChange={setAcompanante} />
              </div>

              {/* ── Remolques / Contenedores / Materiales ─────────────────── */}
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-widest pt-1">
                <Package className="w-3.5 h-3.5" /> Remolques y contenedores
              </div>

              <div className="space-y-3">
                {unidades.map((u, idx) => {
                  if (editingUnit?.id === u.id) return null;
                  const isUnitExpanded = expandedUnits.has(u.id);
                  return (
                    <div key={u.id} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <button type="button" onClick={() => toggleUnit(u.id)} className="flex items-center gap-2 flex-1 text-left">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {u.config === "remolque_contenedor" ? "Remolque + Contenedor" : "Solo remolque"}
                          </span>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => setEditingUnit(u)}
                            className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => setUnidades((p) => p.filter((x) => x.id !== u.id))}
                            className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => toggleUnit(u.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            {isUnitExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      {isUnitExpanded && (
                        <div className="p-4 space-y-3 bg-white divide-y divide-gray-50">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3 h-3 text-blue-500" />
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Remolque</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <MiniField label="Tipo" value={u.remolque.tipo} />
                              <MiniField label="No. Remolque" value={u.remolque.noCaja} mono />
                              <MiniField label="Placas" value={u.remolque.placas} mono />
                              <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                                {u.remolque.color ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.remolque.color)?.hex ?? "transparent" }} />
                                    <span className="text-xs text-gray-600">{resolveColorSwatch(u.remolque.color)?.label}</span>
                                  </div>
                                ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                              </div>
                            </div>
                            {u.remolque.materiales.some((m) => m.producto) && (
                              <div className="pt-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Material</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.remolque.materiales.filter((m) => m.producto).map((m) => (
                                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                                      <CheckCircle2 className="w-2.5 h-2.5" />{m.producto}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {u.config === "remolque_contenedor" && (
                            <div className="pt-3 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3 h-3 text-violet-500" />
                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Contenedor</span>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <MiniField label="Tipo contenedor" value={u.contenedor.tipo} />
                                <MiniField label="No. Contenedor" value={u.contenedor.noContenedor} mono />
                                <MiniField label="No. de Caja" value={u.contenedor.noCaja} mono />
                                <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Color</p>
                                  {u.contenedor.color ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-3.5 h-3.5 rounded-full border border-gray-200" style={{ background: resolveColorSwatch(u.contenedor.color)?.hex ?? "transparent" }} />
                                      <span className="text-xs text-gray-600">{resolveColorSwatch(u.contenedor.color)?.label}</span>
                                    </div>
                                  ) : <p className="text-xs text-gray-300 italic">Sin información</p>}
                                </div>
                              </div>
                              {u.contenedor.materiales.some((m) => m.producto) && (
                                <div className="pt-1">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Material</p>
                                  <div className="flex flex-wrap gap-1">
                                    {u.contenedor.materiales.filter((m) => m.producto).map((m) => (
                                      <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-100">
                                        <CheckCircle2 className="w-2.5 h-2.5" />{m.producto}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {showAgregarUnidad || editingUnit ? (
                  <UnidadEditorCard
                    initialData={editingUnit ?? undefined}
                    onCancel={() => { setShowAgregarUnidad(false); setEditingUnit(null); }}
                    onSave={(u) => {
                      if (editingUnit) {
                        setUnidades((p) => p.map((x) => x.id === u.id ? u : x));
                      } else {
                        setUnidades((p) => [...p, u]);
                        setExpandedUnits((prev) => new Set(prev).add(u.id));
                      }
                      setShowAgregarUnidad(false);
                      setEditingUnit(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAgregarUnidad(true)}
                    className="w-full border-2 border-dashed border-blue-200 rounded-xl py-3 text-sm font-semibold text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar remolque
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onClose(); }}
            className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-100">
            Cancelar
          </Button>
          <Button
            disabled={!numDePase || confirmando}
            onClick={handleConfirmar}
            className={cn(
              "flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2",
              (!numDePase || confirmando) && "opacity-50 cursor-not-allowed",
            )}>
            {confirmando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar llegada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
