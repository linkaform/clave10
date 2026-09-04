/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActivePassesModal } from "@/components/modals/active-passes-modal";
import {
  CarFront,
  DoorOpen,
  Eraser,
  FileSymlink,
  LogIn,
  Menu,
  PackageOpen,
  List,
  Loader2,
  Plus,
  Printer,
  Scan,
  RotateCcw,
  Search,
  Sun,
  UsersRound,
  Webcam,
  Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ComentariosAccesosTable } from "@/components/table/accesos/comentarios/table";
import Credentials from "@/components/pages/accesos/credential";
import { SeleccionMiembro } from "@/components/carrousel-miembros";
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
import { getImgPassUrl } from "@/lib/endpoints";
import { getPdfMulti } from "@/lib/get-pdf-multi";
import { PermisosTable } from "@/components/table/accesos/permisos-certificaciones/table";
import useAuthStore from "@/store/useAuthStore";
import {
  esHexadecimal,
  imprimirUrlEnIframe,
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
import { Equipo, Vehiculo } from "@/lib/update-pass";
import { useBoothStore } from "@/store/useBoothStore";
import { useMenuStore } from "@/store/useGetMenuStore";
import { useScanPreference } from "@/hooks/scan";
import { ConfirmarAccesoModal } from "@/components/modals/confirmar-acceso-modal";
import { useAcompanantesPase } from "@/hooks/useAcompanantesPase";

const AccesosContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const actionParam = searchParams.get("action");
  const { isAuth, userParentId } = useAuthStore();
  const { area, location } = useBoothStore();
  const { excludes }= useMenuStore()
  const { shift, isLoading:loadingShift, turno, downloadPass} = useGetShift(area,location);
  const {setTab, setFilter, setOption} = useShiftStore();
  const { passCode, setPassCode, clearPassCode, selectedEquipos, setSelectedEquipos, setSelectedVehiculos, selectedVehiculos, setTipoMovimiento, tipoMovimiento} = useAccessStore();
  // Ids de los pases de acompañantes seleccionados en el carrusel/modal
  // (MembersCarousel, dentro de Credentials). Vive aquí como estado local,
  // al mismo nivel donde se arma la petición de doAccess — no en un store
  // global — y se pasa hacia abajo por props.
  const [selectedPasses, setSelectedPasses] = useState<string[]>([]);
  // Equipo/vehículo que el guardia confirmó por acompañante (id -> valores
  // confirmados), independiente de selectedPasses — solo aplica al armar el
  // payload de doAccess, nunca se usa para decidir quién entra.
  const [equipoVehiculoConfirmado, setEquipoVehiculoConfirmado] = useState<Record<string, string[]>>({});
  const handleSeleccionAcompanantes = (seleccion: SeleccionMiembro[]) => {
    setSelectedPasses(seleccion.map((s) => s.id));
    setEquipoVehiculoConfirmado(Object.fromEntries(seleccion.map((s) => [s.id, s.equipo_vehiculo ?? []])));
  };
  // Antes de ejecutar el ingreso/salida se muestra un modal chico para
  // confirmar con quién más se hace el movimiento (ver ConfirmarAccesoModal).
  const [confirmModal, setConfirmModal] = useState<"ingreso" | "salida" | null>(null);
  // Permite abrir el modal de "Nueva Visita" directo desde el menú, vía
  // /accesos?action=nueva_visita (mismo patrón que articulos/page.tsx con
  // "nuevo_articulo_concesionado").
  const [isSuccessVisita, setIsSuccessVisita] = useState(false);
  useEffect(() => {
    if (actionParam !== "nueva_visita") return;
    setIsSuccessVisita(true);
    // Se limpia el query param apenas se abre (no solo al cerrar): si se
    // dejara ahí, volver a esta pantalla con el botón "atrás" del navegador
    // reabriría el modal solo, sin que el usuario haya dado click en nada.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    router.replace(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionParam]);
  const handleOpenChangeVisita = (value: React.SetStateAction<boolean>) => {
    const open = typeof value === "function" ? value(isSuccessVisita) : value;
    setIsSuccessVisita(open);
  };
  const { isLoading, loading:loadingSearchPass, searchPass } = useSearchPass(false);
  const { tieneAcompanantes } = useAcompanantesPase(searchPass);
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

  // Trae la imagen de la etiqueta/pase (servicio get_pass_img) y dispara la
  // pantalla de impresión. Se usa tanto desde el botón "Imprimir Etiqueta"
  // como automáticamente al registrar el ingreso (ver doAccess.onSuccess).
  const imprimirEtiquetaDePase = async (recordId: string) => {
    const data = await getImgPassUrl(userParentId ?? 0, recordId);
    const url = data?.response?.data || "";
    if (!url) {
      toast.error("No se pudo obtener la etiqueta");
      return;
    }
    await imprimirUrlEnIframe(url);
  };

  // Cuando el ingreso incluye acompañantes, la etiqueta de un solo pase
  // (get_pass_img/imprimirEtiquetaDePase) no sirve — se necesita el PDF
  // mergeado de get_pdf_multi con el _id de Mongo del titular + cada
  // acompañante seleccionado. El backend lo arma de forma asíncrona y puede
  // tardar hasta ~2 minutos, por eso el spinner en doAccess.onSuccess no se
  // cierra hasta que esta promesa resuelve.
  const imprimirPaseMultiple = async (recordIds: string[]) => {
    const respuesta = await getPdfMulti(recordIds);
    const data = respuesta.response?.data;

    if (!data) {
      throw new Error("No se pudo obtener el PDF combinado");
    }
    if ("error" in data) {
      throw new Error(data.error);
    }
    if ("status_code" in data) {
      throw new Error(data.data || "No hay registros para ser descargados.");
    }
    await imprimirYDescargarPDF(data.path);
  };

  const [imprimiendoEtiqueta, setImprimiendoEtiqueta] = useState(false);
  const handleImprimirEtiqueta = async () => {
    if (!searchPass?._id) return;
    setImprimiendoEtiqueta(true);
    try {
      await imprimirEtiquetaDePase(searchPass._id);
    } catch (err) {
      toast.error(`Error al obtener la etiqueta: ${err}`);
    } finally {
      setImprimiendoEtiqueta(false);
    }
  };

  const exitRegisterAccess = useMutation({
    mutationFn: async () => {
      const data = await exitRegister(area ?? "", location ?? "", passCode, "", selectedPasses);

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
      setSelectedPasses([]);
      setEquipoVehiculoConfirmado({});

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
        // Ids de los pases de acompañantes seleccionados para dar ingreso
        // junto con el titular (vienen de MembersCarousel, via prop local),
        // más el equipo/vehículo que el guardia confirmó para cada uno.
        selected_passes: selectedPasses.map((id) => ({
          id,
          equipo_vehiculo: equipoVehiculoConfirmado[id] ?? [],
        })),
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
      // Se calcula antes de limpiar selectedPasses: en este backend el
      // "qr_code" de cada acompañante (m.id) YA ES su _id de Mongo — no hay
      // un campo _id separado en el objeto crudo, así que selectedPasses ya
      // trae directamente lo que necesita get_pdf_multi (confirmado en vivo:
      // los valores de selectedPasses tienen formato de ObjectId de Mongo).
      const idsAcompanantesIngreso = [...selectedPasses];

      queryClient.invalidateQueries({ queryKey: ["serchPass"] });
      queryClient.invalidateQueries({ queryKey: ["getStats"] });

      setPassCode("");
      setSelectedPasses([]);
      setEquipoVehiculoConfirmado({});

      toast.success("Entrada Exitosa", {
        style: {
          background: "#22c55e",
          color: "white",
        },
      });

      if (downloadPass.includes("impresion_de_pase") && id) {
        const tieneAcompanantesEnEsteIngreso = idsAcompanantesIngreso.length > 0;

        Swal.fire({
          title: "Preparando documento",
          html: tieneAcompanantesEnEsteIngreso
            ? "Generando PDF con acompañantes, esto puede tardar hasta 2 minutos..."
            : "Cargando PDF para imprimir...",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const impresion = tieneAcompanantesEnEsteIngreso
          ? imprimirPaseMultiple([id, ...idsAcompanantesIngreso])
          : imprimirEtiquetaDePase(id);

        impresion
          .catch((err) => toast.error(`Error al obtener el documento: ${err}`))
          .finally(() => Swal.close());
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
    <div >
		<ConfirmarAccesoModal
			open={confirmModal !== null}
			onClose={() => setConfirmModal(null)}
			onConfirm={() => {
				if (confirmModal === "ingreso") doAccess.mutate();
				else if (confirmModal === "salida") exitRegisterAccess.mutate();
				setConfirmModal(null);
			}}
			searchPass={searchPass}
			tipo={confirmModal ?? "ingreso"}
			initialSelectedIds={selectedPasses}
			onChangeSelected={setSelectedPasses}
			loading={doAccess.isPending || exitRegisterAccess.isPending}
		/>
		<div className="flex flex-col w-full ">
			<div className="p-6 space-y-6 w-full mx-auto pb-0 ">

				<div className="flex justify-center flex-col md:flex-row gap-3 ">
					<div className="flex justify-center mb-5 mr-5 w-full md:max-w-lg ">
						<div className="relative w-full flex items-center ">
							<Input
							ref={inputRef}
							type="text"
							placeholder="Escanear Pase"
							className="pl-5 pr-10 w-full"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							/>
							<Search className="absolute right-12 h-4 w-4 text-gray-500 pointer-events-none" />

							<ActivePassesModal title="Pases Activos"  input={debouncedValue} setOpen={setOpenActivePases} open={openActivePases}>
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full border rounded-tl-none rounded-bl-none rounded-tr-sm rounded-br-sm"
							>
								<Menu className="h-4 w-4" />
							</Button>
							</ActivePassesModal>
						</div>
					</div>
 					<div className="flex flex-col sm:flex-row gap-2">
					{searchPass?.tipo_movimiento === "Entrada" && (
						<Button
						className="bg-green-600 hover:bg-green-700"
						onClick={() => {
							if (shift?.guard?.status_turn === "Turno Cerrado") {
							toast.error(
								"¡Debes iniciar turno antes de registrar un ingreso!."
							);
							return;
							}
							if (!tieneAcompanantes) {
							doAccess.mutate();
							return;
							}
							setConfirmModal("ingreso");
						}}
						>
						<LogIn />
						Registrar Ingreso
						</Button>
					)}

					{searchPass?.tipo_movimiento === "Salida" && (
						<Button
						className="bg-red-500 hover:bg-red-600 text-white"
						onClick={() => {
							if (shift?.guard?.status_turn === "Turno Cerrado") {
							toast.error(
								"¡Debes iniciar turno antes de registrar una salida!."
							);
							return;
							}

							if (!tieneAcompanantes) {
							exitRegisterAccess.mutate();
							return;
							}

							setConfirmModal("salida");
						}}
						>
						<DoorOpen />
						Registrar Salida
						</Button>
					)}

					{searchPass?._id && (
						<Button
						className="bg-slate-600 hover:bg-slate-700 text-white"
						onClick={handleImprimirEtiqueta}
						disabled={imprimiendoEtiqueta}
						>
						{imprimiendoEtiqueta ? (
							<Loader2 className="animate-spin" />
						) : (
							<Printer />
						)}
						Imprimir Etiqueta
						</Button>
					)}

					<ScanPassOptionsModal
							title="Escanea Pase"
							inputRef={inputRef}
							preference={preference}
							setPreference={setPreference}
						>
							<Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
								{preference === 'camera' ? <Webcam className="w-4 h-4" /> : <Scan />}
								{preference === 'camera' ? 'Escanear con Cámara'
								: preference === 'scanner' ? 'Escanear con Scanner'
								: 'Escanear Pase'}
							</Button>
						</ScanPassOptionsModal>

						{preference && (
							<Button
								type="button"
								size="icon"
								variant="ghost"
								onClick={reset}
								className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
								title="Resetear preferencia"
							>
								<RotateCcw className="w-4 h-4" />
							</Button>
						)}

					{!passCode && isExcluded("nueva_visita", excludes?? undefined) && (
						<AddVisitModal
							title="Nueva Visita"
							isSuccess={isSuccessVisita}
							setIsSuccess={handleOpenChangeVisita}>
						<Button className="bg-green-600 hover:bg-green-700 text-white">
							<Plus />
							Nueva Visita
						</Button>
						</AddVisitModal>
					)}

					{ !searchPass ? (<>
					<TemporaryPassesModal title="Pases en Proceso">
						<Button
						variant="secondary"
						className="bg-blue-500 hover:bg-blue-600 text-white"
						>
						<List className="text-white" />
						Pases en Proceso
						</Button>
					</TemporaryPassesModal></>):null}
					{ searchPass ? (<>
					<Button
						className="bg-red-500 hover:bg-red-600 text-white"
						variant="secondary"
						onClick={() =>{ setDebouncedValue(""); clearPassCode(); }}
					>
						<Eraser className="text-white" />

					</Button></>):null}

					{ searchPass?.estatus=="proceso" && isExcluded("completar_pase", excludes ?? undefined) ? (<>
					<UpdatePassModal title={"Completar Pase"} id={searchPass?._id} dataCatalogos={searchPass}>
						<Button
							className="bg-blue-500 hover:bg-blue-600 text-white"
							variant="secondary"
						>
							<FileSymlink />  Completar Pase

						</Button>
					</UpdatePassModal>
					</>):null}
					</div>
				</div>
			</div>

			{ searchPass ? (
			<>
				<div className="grid grid-cols-1 md:grid-cols-3">
					<div className="row-span-3 flex flex-col p-4 ">
						<Credentials searchPass={searchPass} onSeleccionPases={handleSeleccionAcompanantes} />
					</div>
					<div className="flex flex-col pl-0 p-4 gap-3 ">
						<ComentariosAccesosTable allComments={allComments} />
						<PermisosTable certificaciones={certificaciones}/>
					</div>

					<div className="flex flex-col pl-0 p-4 gap-3 ">
						<UltimosAccesosTable ultimosAccesos={ultimosAccesos} /> 
						<AccesosPermitidosTable accesosPermitidos={accesosPermitidos} />
					</div>

						
					  <div className="col-span-2 col-start-2 pr-4 mb-5">
					 	<div className="fbg-slate-400">
					 		<div className="">
					 			<EquiposAutorizadosTable equipos={equipos} setEquipos={setEquipos} setSelectedEquipos={setSelectedEquipos} selectedEquipos={selectedEquipos} tipoMovimiento={tipoMovimiento}/>
					 		</div>

					 		<div className="">
					 			<VehiculosAutorizadosTable vehiculos={vehiculos} setVehiculos={setVehiculos} setSelectedVehiculos={setSelectedVehiculos} selectedVehiculos={selectedVehiculos} tipoMovimiento={tipoMovimiento}
								vehiculoHabilitado={vehiculoHabilitado}/>
					 		</div>
					 	</div>
					 </div>
					 
				</div>
				
			</>
			):null}
		</div>
		{!searchPass ?
	  	<div className="flex flex-col justify-center items-center gap-10 mt-20 overflow-hidden">
				<div className="flex flex-col justify-center w-1/6 gap-2">
					<Input placeholder="Ubicacion" value={location} disabled/>
					<Input placeholder="Area" value={area} disabled/>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					<Link  href={"/dashboard/bitacoras"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100`} onClick={() => setTabAndFilter("Personal", "today", ["entrada"])}>
						<div className="flex gap-6"><Sun className="text-primary w-14 h-14" />
							<span className="flex items-center font-bold text-5xl"> {stats?.visitas_en_dia}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Visitas En El Día</span>
					</div>
					</Link>

					<Link  href={"/dashboard/bitacoras"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100 `} onClick={() => setTabAndFilter("Personal", "", ["entrada"])}>
						<div className="flex gap-6"><UsersRound className="text-primary w-14 h-14"/>
							<span className="flex items-center font-bold text-5xl"> {stats?.personas_dentro}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Personas Dentro</span>
					</div>
					</Link>
					<Link  href={"/dashboard/bitacoras"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100 `} onClick={() => {setTabAndFilter("Personal", "today", ["salida"]); }}>
						<div className="flex gap-6"><DoorOpen className="text-primary w-14 h-14"/>
							<span className="flex items-center font-bold text-5xl"> {stats?.salidas_registradas}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Salidas Registradas</span>
					</div>
					</Link>
					<Link  href={"/dashboard/articulos"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100 `} onClick={() => setTabAndFilter("Paqueteria", "",[])}>
						<div className="flex gap-6"><PackageOpen className="text-primary w-14 h-14"/>
							<span className="flex items-center font-bold text-5xl"> {stats?.paquetes_recibidos}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Paquetes Recibidos</span>
					</div>
					</Link>
					<Link href={"/dashboard/bitacoras"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100 `} onClick={() => setTabAndFilter("Vehiculos", "",["entrada"])}>
						<div className="flex gap-6"><CarFront className="text-primary w-14 h-14"/>
							<span className="flex items-center font-bold text-5xl"> {stats?.total_vehiculos_dentro}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Vehículos Dentro</span>
					</div>
					</Link>
					<Link href={"/dashboard/bitacoras"}>
					<div className={`border p-4 px-12 py-6 rounded-md cursor-pointer transition duration-100 `} onClick={() => setTabAndFilter("Equipos", "",["entrada"])}>
						<div className="flex gap-6"><Wrench className="text-primary w-14 h-14"/>
							<span className="flex items-center font-bold text-5xl"> {stats?.total_equipos_dentro}</span>
						</div>
						<div className="flex items-center space-x-0">
							<div className="h-1 w-1/2 bg-cyan-100"></div>
							<div className="h-1 w-1/2 bg-blue-500"></div>
						</div>
						<span className="text-lg">Equipos Dentro</span>
					</div>
					</Link>
				</div>
		</div>
		:null}
    </div>
  );
};

const AccesosPage = () => (
  <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Cargando...</div>}>
    <AccesosContent />
  </Suspense>
);

export default AccesosPage;
