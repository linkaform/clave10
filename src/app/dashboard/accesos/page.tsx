/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { ActivePassesModal } from "@/components/modals/active-passes-modal";
import {
  CarFront,
  Clock,
  DoorOpen,
  Eraser,
  FileSymlink,
  LogIn,
  PackageOpen,
  List,
  QrCode,
  Truck,
  RotateCcw,
  Search,
  UserPlus,
  UsersRound,
  Webcam,
  Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ComentariosAccesosTable } from "@/components/table/accesos/comentarios/table";
import Credentials from "@/components/pages/accesos/credential";
import { AccesosPermitidosTable } from "@/components/table/accesos/accesos-permitidos/table";
import { UltimosAccesosTable } from "@/components/table/accesos/ultimos-accesos/table";
import { VehiculosAutorizadosTable } from "@/components/table/accesos/vehiculos-autorizados/table";
import { EquiposAutorizadosTable } from "@/components/table/accesos/equipos-autorizados/table";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TemporaryPassesModal } from "@/components/modals/temporary-passes-modal";
import { useSearchPass } from "@/hooks/useSearchPass";
import { useAccessStore } from "@/store/useAccessStore";
import { AddVisitModal } from "@/components/modals/add-visit-modal";
import { toast } from "sonner";
import { useGetShift } from "@/hooks/useGetShift";
import { exitRegister, registerIncoming } from "@/lib/access";
import { PermisosTable } from "@/components/table/accesos/permisos-certificaciones/table";
import useAuthStore from "@/store/useAuthStore";
import {
  esHexadecimal,
  imprimirYDescargarPDF,
  isExcluded,
  isVehiculoHabilitado,
} from "@/lib/utils";
import Link from "next/link";
import { useGetStats } from "@/hooks/useGetStats";
import { ScanPassOptionsModal } from "@/components/modals/scan-pass-options";
import Swal from "sweetalert2";
import { useAreasLocationStore } from "@/store/useGetAreaLocationByUser";
import { UpdatePassModal } from "@/components/modals/complete-pass-accesos";
import Image from "next/image";
import { useGetPdf } from "@/hooks/usetGetPdf";
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { useBoothStore } from "@/store/useBoothStore";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useScanPreference } from "@/hooks/scan";
import { NuevoAccesoTransportistaModal } from "@/components/modals/nuevo-acceso-transportista-modal";

const AccesosPage = () => {
  const { isAuth, userParentId } = useAuthStore();
  const { area, location } = useBoothStore();
  const { excludes } = useMenuStore();
  const {
    shift,
    isLoading: loadingShift,
    turno,
    downloadPass,
  } = useGetShift(area, location);
  const { setTab, setFilter, setOption } = useShiftStore();
  const {
    passCode,
    setPassCode,
    clearPassCode,
    selectedEquipos,
    setSelectedEquipos,
    setSelectedVehiculos,
    selectedVehiculos,
    setTipoMovimiento,
    tipoMovimiento,
  } = useAccessStore();
  const {
    isLoading,
    loading: loadingSearchPass,
    searchPass,
  } = useSearchPass(false);
  const [inputValue, setInputValue] = useState("");
  const [openActivePases, setOpenActivePases] = useState(false);
  const queryClient = useQueryClient();
  const [debouncedValue, setDebouncedValue] = useState("");
  const { data: stats } = useGetStats(
    true,
    location ?? "",
    area ?? "",
    "Accesos",
  );
  const { loading: loadingLocationArea } = useAreasLocationStore();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const { preference, setPreference, reset } = useScanPreference();
  const [openTransportista, setOpenTransportista] = useState(false);
  const { refetch } = useGetPdf(userParentId, id ?? "", false);

  useEffect(() => {
    if (searchPass) {
      setId(searchPass?._id);
      setEquipos(searchPass?.grupo_equipos);
      setSelectedEquipos(searchPass?.grupo_equipos);
      const ultimoVehiculo =
        searchPass?.grupo_vehiculos?.[searchPass.grupo_vehiculos.length - 1];
      setVehiculos(searchPass?.grupo_vehiculos);
      setSelectedVehiculos([ultimoVehiculo]);
      setTipoMovimiento(searchPass?.tipo_movimiento);
    }
  }, [
    searchPass?.grupo_equipos,
    searchPass?.grupo_vehiculos,
    searchPass?.tipo_movimiento,
  ]);

  const vehiculoHabilitado = isVehiculoHabilitado(
    searchPass?.habilitar_vehiculo,
  );
  const handleGetPdf = async () => {
    try {
      const result = await refetch();

      if (result.error) {
        toast.error(`Error de red: ${result.error}`, {
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
        return;
      }

      const data = result.data?.response?.data;

      if (!data || data.status_code !== 200) {
        const errorMsg =
          data?.json?.error ||
          result.data?.error ||
          "Error desconocido del servidor";

        toast.error(`Error de red: ${errorMsg}`, {
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
        return;
      }

      const downloadUrl = data?.json?.download_url;

      if (downloadUrl) {
        imprimirYDescargarPDF(downloadUrl);
      } else {
        toast.warning("No se encontró URL de descarga");
      }
    } catch (err) {
      toast.error(`Error inesperado: ${err}`, {
        style: {
          backgroundColor: "#f44336",
          color: "#fff",
        },
      });
    }
  };

  const exitRegisterAccess = useMutation({
    mutationFn: async () => {
      const data = await exitRegister(area ?? "", location ?? "", passCode);

      if (!data.success) {
        throw new Error(data.error?.msg?.msg || "Hubo un error en la Salida");
      }

      return data.response?.data || [];
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      setPassCode("");

      toast.success("Salida Exitosa", {
        style: {
          background: "#22c55e",
          color: "white",
        },
      });

      queryClient.invalidateQueries({ queryKey: ["serchPass"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error al realizar la salida:",
        text: error.message,
        confirmButtonText: "OK",
        customClass: {
          confirmButton:
            "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow",
        },
        buttonsStyling: false,
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  //COMENTADO
  const certificaciones = Array.isArray(searchPass?.certificaciones)
    ? searchPass.certificaciones
    : [];

  const ultimosAccesos = Array.isArray(searchPass?.ultimo_acceso)
    ? searchPass.ultimo_acceso
    : [];

  const accesosPermitidos = Array.isArray(searchPass?.grupo_areas_acceso)
    ? searchPass.grupo_areas_acceso
    : [];

  const { newCommentsPase, setAllComments } = useAccessStore();

  const allComments = [
    ...(newCommentsPase || []),
    ...(searchPass?.grupo_instrucciones_pase || []),
  ];

  React.useEffect(() => {
    if (allComments.length > 0) {
      setAllComments(allComments);
    }
  }, [newCommentsPase]);

  const doAccess = useMutation({
    mutationFn: async () => {
      const data = await registerIncoming({
        area,
        location,
        visita_a: searchPass?.visita_a,
        qr_code: passCode,
        vehiculo: selectedVehiculos,
        equipo: selectedEquipos,
        comentario_acceso: [],
        comentario_pase: allComments,
      });

      if (!data.success) {
        throw new Error(
          data.error?.exception?.msg[0] || "Hubo un error en el Ingreso",
        );
      }

      return data.response?.data || [];
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serchPass"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });

      setPassCode("");

      toast.success("Entrada Exitosa", {
        style: {
          background: "#22c55e",
          color: "white",
        },
      });

      if (downloadPass.includes("impresion_de_pase")) {
        Swal.fire({
          title: "Preparando documento",
          html: "Cargando PDF para imprimir...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        handleGetPdf();
      }
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: "Error al realizar ingreso:",
        text: error.message,
        confirmButtonText: "OK",
        customClass: {
          confirmButton:
            "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow",
        },
        buttonsStyling: false,
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    if (inputValue) {
      const handler = setTimeout(() => {
        setDebouncedValue(inputValue);
      }, 700);
      return () => clearTimeout(handler);
    }
  }, [inputValue]);

  useEffect(() => {
    if (debouncedValue) {
      if (esHexadecimal(inputValue)) {
        setInputValue("");
        setPassCode(inputValue);
      } else {
        setOpenActivePases(true);
        setPassCode("");
        setInputValue("");
      }
    } else {
      setOpenActivePases(false);
      setPassCode("");
      setPassCode("");
      setInputValue("");
    }
  }, [debouncedValue]);

  function setTabAndFilter(tab: string, filter: string, option: string[]) {
    setTab(tab);
    setFilter(filter);
    setOption(option);
  }

  if (
    isLoading ||
    loadingSearchPass ||
    loading ||
    loadingShift ||
    loadingLocationArea
  ) {
    return (
      <div className="flex justify-center items-center h-screen overflow-hidden">
        <div className="w-24 h-24 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!turno && isAuth) {
    return (
      <div className="flex justify-center items-center overflow-hidden mt-32">
        <div className="flex items-center flex-col gap-2">
          <Image
            src="/guardia1.png"
            alt="Next.js img"
            width={300}
            height={300}
            priority
          />

          <div className="text-2xl font-bold">
            Inicia turno para comenzar...
          </div>
          <p className="text-gray-500">
            Activa tus funciones registrando el inicio de turno.
          </p>
          <Link href="/dashboard/turnos">
            <Button
              className="w-40 h-9 mt-5 px-3 border border-blue-500 bg-blue-500 rounded-md text-sm text-white font-medium hover:bg-blue-600"
              variant="default">
              Turnos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-800">Control de Accesos</h1>

        {/* Barra de búsqueda + acciones */}
        <div className="flex items-center gap-3">
          {/* Search card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-3 items-center flex-1">
            <div className="relative flex items-center flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Escanear Pase"
                className="pl-10 pr-10 border-0 bg-gray-50 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <ActivePassesModal
                title="Pases Activos"
                input={debouncedValue}
                setOpen={setOpenActivePases}
                open={openActivePases}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">
                  <List className="w-4 h-4" />
                </Button>
              </ActivePassesModal>
            </div>
            <ScanPassOptionsModal
              title="Escanea Pase"
              inputRef={inputRef}
              preference={preference}
              setPreference={setPreference}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shrink-0">
                {preference === "camera" ? <Webcam className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                {preference === "camera" ? "QR con Cámara" : "Escanear QR"}
              </Button>
            </ScanPassOptionsModal>
            {preference && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={reset}
                className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                title="Resetear preferencia">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Botones de acción — fuera de la card, misma fila */}
          {searchPass?.tipo_movimiento === "Entrada" && (
            <Button
              className="bg-green-600 hover:bg-green-700 gap-2 shrink-0"
              onClick={() => {
                if (shift?.guard?.status_turn === "Turno Cerrado") {
                  toast.error("¡Debes iniciar turno antes de registrar un ingreso!.");
                  return;
                }
                doAccess.mutate();
              }}>
              <LogIn className="w-4 h-4" /> Registrar Ingreso
            </Button>
          )}
          {searchPass?.tipo_movimiento === "Salida" && (
            <Button
              className="bg-red-500 hover:bg-red-600 text-white gap-2 shrink-0"
              onClick={() => {
                if (shift?.guard?.status_turn === "Turno Cerrado") {
                  toast.error("¡Debes iniciar turno antes de registrar una salida!.");
                  return;
                }
                exitRegisterAccess.mutate();
              }}>
              <DoorOpen className="w-4 h-4" /> Registrar Salida
            </Button>
          )}
          {searchPass?.estatus === "proceso" &&
            isExcluded("completar_pase", excludes ?? undefined) && (
              <UpdatePassModal title="Completar Pase" id={searchPass._id} dataCatalogos={searchPass}>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2 shrink-0" variant="secondary">
                  <FileSymlink className="w-4 h-4" /> Completar Pase
                </Button>
              </UpdatePassModal>
            )}
          {searchPass && (
            <Button
              size="icon"
              variant="ghost"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
              onClick={() => { setDebouncedValue(""); clearPassCode(); }}>
              <Eraser className="w-4 h-4" />
            </Button>
          )}
          {!searchPass && (
            <TemporaryPassesModal title="Pases en Proceso">
              <Button variant="outline" className="rounded-xl gap-2 shrink-0">
                <Clock className="w-4 h-4" />
                Pases en proceso
              </Button>
            </TemporaryPassesModal>
          )}
        </div>

      </div>

      {/* Detalle del pase — full width */}
      {searchPass ? (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="row-span-3 flex flex-col p-4">
              <Credentials searchPass={searchPass} />
            </div>
            <div className="flex flex-col pl-0 p-4 gap-3">
              <ComentariosAccesosTable allComments={allComments} />
              <PermisosTable certificaciones={certificaciones} />
            </div>
            <div className="flex flex-col pl-0 p-4 gap-3">
              <UltimosAccesosTable ultimosAccesos={ultimosAccesos} />
              <AccesosPermitidosTable accesosPermitidos={accesosPermitidos} />
            </div>
            <div className="col-span-2 col-start-2 pr-4 mb-5 space-y-4">
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                <EquiposAutorizadosTable
                  equipos={equipos}
                  setEquipos={setEquipos}
                  setSelectedEquipos={setSelectedEquipos}
                  selectedEquipos={selectedEquipos}
                  tipoMovimiento={tipoMovimiento}
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100">
                <VehiculosAutorizadosTable
                  vehiculos={vehiculos}
                  setVehiculos={setVehiculos}
                  setSelectedVehiculos={setSelectedVehiculos}
                  selectedVehiculos={selectedVehiculos}
                  tipoMovimiento={tipoMovimiento}
                  vehiculoHabilitado={vehiculoHabilitado}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 pb-6 space-y-6">
            {/* Acciones rápidas */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Acciones Rápidas
              </h2>
              <div className="flex gap-4">
                {!passCode &&
                  isExcluded("nueva_visita", excludes ?? undefined) && (
                    <AddVisitModal title="Nueva Visita">
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 w-52 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors" />
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                            <UserPlus className="w-5 h-5 text-green-600" />
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">
                            Nueva visita
                          </p>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Registra manualmente a un visitante.
                          </p>
                        </div>
                      </div>
                    </AddVisitModal>
                  )}
                <div
                  className="bg-white rounded-2xl border border-gray-100 p-5 w-52 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
                  onClick={() => setOpenTransportista(true)}>
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors" />
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                      <Truck className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Nuevo transportista
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Registra ingreso de transporte y carga.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Métricas del día */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Métricas del Día
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link
                  href="/dashboard/bitacoras"
                  onClick={() =>
                    setTabAndFilter("Personal", "today", ["entrada"])
                  }>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <UsersRound className="w-6 h-6 text-blue-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.visitas_en_dia}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Visitas del día
                    </span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/bitacoras"
                  onClick={() => setTabAndFilter("Personal", "", ["entrada"])}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <UserPlus className="w-6 h-6 text-green-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.personas_dentro}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Personas dentro
                    </span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/bitacoras"
                  onClick={() =>
                    setTabAndFilter("Personal", "today", ["salida"])
                  }>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <DoorOpen className="w-6 h-6 text-orange-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.salidas_registradas}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Salidas registradas
                    </span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/articulos"
                  onClick={() => setTabAndFilter("Paqueteria", "", [])}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <PackageOpen className="w-6 h-6 text-purple-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.paquetes_recibidos}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Paquetes recibidos
                    </span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/bitacoras"
                  onClick={() => setTabAndFilter("Vehiculos", "", ["entrada"])}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <CarFront className="w-6 h-6 text-cyan-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.total_vehiculos_dentro}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Vehículos dentro
                    </span>
                  </div>
                </Link>
                <Link
                  href="/dashboard/bitacoras"
                  onClick={() => setTabAndFilter("Equipos", "", ["entrada"])}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer">
                    <Wrench className="w-6 h-6 text-gray-400 mb-2" />
                    <span className="text-3xl font-bold text-gray-800">
                      {stats?.total_equipos_dentro}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Equipos dentro
                    </span>
                  </div>
                </Link>
              </div>
            </section>
        </div>
      )}

      <NuevoAccesoTransportistaModal
        open={openTransportista}
        onClose={() => setOpenTransportista(false)}
      />
    </div>
  );
};

export default AccesosPage;
