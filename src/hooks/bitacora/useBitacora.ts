import { Bitacora_record } from "@/components/table/bitacoras/bitacoras-columns";
import { getPdf } from "@/lib/get-pdf";
import { dateToString, imprimirYDescargarPDF } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { useBoothStore } from "@/store/useBoothStore";
import { useShiftStore } from "@/store/useShiftStore";
import {
  processBitacorasV,
  processBitacorasE,
} from "@/utils/processBitacoraRecord";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { useGetStats } from "../useGetStats";
import { useBitacoras } from "../Bitacora/useBitacoras";

export const useBitacora = (
  dynamicFilters?: { key: string; value: string }[],
) => {
  const { tab, filter, option, from, setFrom } = useShiftStore();
  const { location } = useBoothStore();
  const { userParentId } = useAuthStore();
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<
    string | string[]
  >("");
  const [equiposData, setEquiposData] = useState<Bitacora_record[]>([]);
  const [vehiculosData, setVehiculosData] = useState<Bitacora_record[]>([]);
  const [isPersonasDentro, setIsPersonasDentro] = useState(false);
  const [date1, setDate1] = useState<Date | "">("");
  const [date2, setDate2] = useState<Date | "">("");
  const [selectedOption, setSelectedOption] = useState<string[]>(option);
  const [dates, setDates] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<string>(filter);
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("todas");
  const [selectedTab, setSelectedTab] = useState<string>(
    tab ? tab : "Personal",
  );
  const [viewMode, setViewMode] = useState<"table" | "photos" | "list">(
    "photos",
  );
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [modalForceQuitAbierto, setModalForceQuitAbierto] = useState(false);
  const [modalSalidaAbierto, setModalSalidaAbierto] = useState(false);
  const [modalAgregarBadgeAbierto, setModalAgregarBadgeAbierto] =
    useState(false);
  const [isForcingQuit, setIsForcingQuit] = useState(false);

  const [modalRegresarGafeteAbierto, setModalRegresarGafeteAbierto] =
    useState(false);
  const [bitacoraSeleccionada, setBitacoraSeleccionada] =
    useState<Bitacora_record | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const { listBitacoras, isLoadingListBitacoras, refetchBitacoras } =
    useBitacoras(
      ubicacionSeleccionada,
      areaSeleccionada == "todas" ? "" : areaSeleccionada,
      selectedOption,
      ubicacionSeleccionada && areaSeleccionada ? true : false,
      dates[0],
      dates[1],
      dateFilter,
      dynamicFilters,
      pagination.pageSize,
      pagination.pageIndex * pagination.pageSize,
    );
  const { data: stats, refetch: refetchStats } = useGetStats(
    ubicacionSeleccionada && areaSeleccionada ? true : false,
    ubicacionSeleccionada,
    areaSeleccionada == "todas" ? "" : areaSeleccionada,
    "Bitacoras",
  );

  const refreshData = async () => {
    await Promise.all([refetchBitacoras(), refetchStats()]);
  };

  const recordsVehiculos = processBitacorasV(listBitacoras?.records || []);
  const recordsEquipos = processBitacorasE(listBitacoras?.records || []);

  const handleDateFilter = () => {
    if (date1 && date2) {
      const f1 = dateToString(new Date(date1));
      const f2 = dateToString(new Date(date2));
      setDates([f1, f2]);
    } else {
      toast.error("Escoge un rango de fechas.");
    }
  };

  const handlePrintPase = async (paseId: string) => {
    Swal.fire({
      title: "Preparando documento",
      html: "Cargando PDF para imprimir...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const result = await getPdf(userParentId, paseId);
      const data = result?.response?.data;

      if (!data || data.status_code !== 200) {
        const errorMsg = data?.json?.error || "Error desconocido del servidor";
        toast.error(`Error del servidor: ${errorMsg}`, {
          style: {
            backgroundColor: "#f44336",
            color: "#fff",
          },
        });
        Swal.close();
        return;
      }

      const downloadUrl = data?.json?.download_url || data?.data?.download_url;

      if (downloadUrl) {
        imprimirYDescargarPDF(downloadUrl);
        Swal.close();
      } else {
        toast.warning("No se encontró URL de descarga");
        Swal.close();
      }
    } catch (err) {
      console.error("Error al obtener PDF:", err);
      toast.error(`Error inesperado: ${err}`, {
        style: {
          backgroundColor: "#f44336",
          color: "#fff",
        },
      });
      Swal.close();
    }
  };

  const handleRegresarGafete = (bitacora: Bitacora_record) => {
    setBitacoraSeleccionada(bitacora);
    setModalRegresarGafeteAbierto(true);
  };
  const handleSalida = (bitacora: Bitacora_record) => {
    setBitacoraSeleccionada(bitacora);
    setModalSalidaAbierto(true);
  };
  const handleAgregarBadge = (bitacora: Bitacora_record) => {
    setBitacoraSeleccionada(bitacora);
    setModalAgregarBadgeAbierto(true);
  };

  useEffect(() => {
    if (location) {
      setUbicacionSeleccionada(location);
    }
  }, [location]);

  useEffect(() => {
    if (
      Array.isArray(listBitacoras) &&
      listBitacoras.length > 0 &&
      from === "turnos"
    ) {
      setDateFilter(filter);
      setSelectedTab(tab);
      setFrom("");
    }
  }, [filter, from, listBitacoras, selectedTab, setFrom, tab]);

  useEffect(() => {
    if (listBitacoras?.records) {
      if (Array.isArray(listBitacoras.records)) {
        setEquiposData(processBitacorasE(listBitacoras.records));
        setVehiculosData(processBitacorasV(listBitacoras.records));
      } else {
        setEquiposData(processBitacorasE([]));
        setVehiculosData(processBitacorasV([]));
      }
    }
  }, [listBitacoras]);

  return {
    // Values
    bitacoraSeleccionada,
    date1,
    date2,
    dateFilter,
    dates,
    equiposData,
    isForcingQuit,
    isLoadingListBitacoras,
    isPersonasDentro,
    listBitacoras,
    modalAgregarBadgeAbierto,
    modalForceQuitAbierto,
    modalRegresarGafeteAbierto,
    modalSalidaAbierto,
    pagination,
    recordsEquipos,
    recordsVehiculos,
    searchTags,
    stats,
    ubicacionSeleccionada,
    vehiculosData,
    viewMode,
    // Methods
    handleAgregarBadge,
    handleDateFilter,
    handlePrintPase,
    handleRegresarGafete,
    handleSalida,
    refreshData,
    setAreaSeleccionada,
    setDate1,
    setDate2,
    setDateFilter,
    setIsForcingQuit,
    setIsPersonasDentro,
    setModalAgregarBadgeAbierto,
    setModalForceQuitAbierto,
    setModalRegresarGafeteAbierto,
    setModalSalidaAbierto,
    setPagination,
    setSearchTags,
    setSelectedOption,
    setUbicacionSeleccionada,
    setViewMode,
  };
};
