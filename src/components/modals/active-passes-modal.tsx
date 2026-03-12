/* eslint-disable react-hooks/exhaustive-deps */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

import SearchInput from "../search-input";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { esHexadecimal } from "@/lib/utils";
import { toast } from "sonner";
import { useAccessStore } from "@/store/useAccessStore";
import { usePasses } from "@/hooks/usePasses";
import { useBoothStore } from "@/store/useBoothStore";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Forward, Hammer, IdCard } from "lucide-react";
import { EqipmentLocalPassModal } from "@/components/modals/add-local-equipo";
import { VehicleLocalPassModal } from "@/components/modals/add-local-vehicule";
import { AddBadgeModal } from "@/components/modals/add-badge-modal";
import { DoOutModal } from "@/components/modals/do-out-modal";
import { Equipo, Vehiculo } from "@/lib/update-pass";

interface ActivePassesModalProps {
  title: string;
  children: React.ReactNode;
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  input: string;
}

interface PassCardProps {
  item: any;
  isSelected: boolean;
  onSelect: (item: any) => void;
  area: string;
  location: string;
}

const PassCard: React.FC<PassCardProps> = ({ item, isSelected, onSelect, area, location }) => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [modalBadgeOpen, setModalBadgeOpen] = useState(false);
  const [modalSalidaOpen, setModalSalidaOpen] = useState(false);

  const avatarUrl = item?.foto?.[0]?.file_url || "/nouser.svg";
  const isEntrada = item?.tipo_movimiento === "Entrada";
  const isSalida = item?.tipo_movimiento === "Salida";
  const isAsignado = item?.status_gafete?.toLowerCase() === "asignado";
  const hasSalida = !!item?.fecha_salida;

  const badgeBg = isSalida
    ? "bg-slate-600 hover:bg-slate-700"
    : "bg-sky-500 hover:bg-sky-600";

  const iconClass = (disabled: boolean) =>
    `flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none border ${
      disabled
        ? "text-slate-300 border-slate-100 cursor-not-allowed"
        : "text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
    }`;

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Photo area */}
      <div
        className="relative cursor-pointer"
        style={{ aspectRatio: "4/3" }}
        onClick={() => onSelect(item)}
      >
        <Image
          src={avatarUrl}
          alt={item.nombre || "Sin nombre"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          crossOrigin="anonymous"
        />

        {/* Checkbox top-left */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-white/90 rounded-md p-0.5 shadow">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(item)}
              className="h-5 w-5"
            />
          </div>
        </div>

        {/* Badge top-right */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className={`${badgeBg} text-white text-xs font-semibold px-2.5 py-0.5 border-none`}>
            {item?.tipo_movimiento ?? "Entrada"}
          </Badge>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-1">
        <p className="font-bold text-slate-900 text-sm leading-tight truncate">
          {item.nombre}
        </p>
        {item.empresa && (
          <p className="text-slate-500 text-xs truncate">{item.empresa}</p>
        )}
        {item.fecha_de_caducidad && (
          <p className="text-sky-600 text-xs">
            Vigencia: {item.fecha_de_caducidad}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-3 pb-3 flex gap-1 justify-between">
        {/* Equipo */}
        {isSalida ? (
          <div className={iconClass(true)} title="Agregar equipo (No disponible)">
            <Hammer className="w-5 h-5" />
            <span>Equipo</span>
          </div>
        ) : (
          <EqipmentLocalPassModal
            title="Agregar equipo"
            id={item._id}
            equipos={equipos}
            setEquipos={setEquipos}
            isAccesos={false}
            fetch={true}
          >
            <div className={iconClass(false)} title="Agregar equipo">
              <Hammer className="w-5 h-5" />
              <span>Equipo</span>
            </div>
          </EqipmentLocalPassModal>
        )}

        {/* Vehículo */}
        {isSalida ? (
          <div className={iconClass(true)} title="Agregar vehículo (No disponible)">
            <Car className="w-5 h-5" />
            <span>Vehículo</span>
          </div>
        ) : (
          <VehicleLocalPassModal
            title="Agregar vehículo"
            vehicles={vehiculos}
            setVehiculos={setVehiculos}
            isAccesos={false}
            id={item._id}
            fetch={true}
          >
            <div className={iconClass(false)} title="Agregar vehículo">
              <Car className="w-5 h-5" />
              <span>Vehículo</span>
            </div>
          </VehicleLocalPassModal>
        )}

        {/* Gafete */}
        {isSalida ? (
          <div className={iconClass(true)} title="Gafete (No disponible)">
            <IdCard className="w-5 h-5" />
            <span>Gafete</span>
          </div>
        ) : (
          <>
            <div
              className={iconClass(false)}
              title={isEntrada && isAsignado ? "Regresar gafete" : "Agregar gafete"}
              onClick={() => setModalBadgeOpen(true)}
            >
              <IdCard className={`w-5 h-5 ${isEntrada && isAsignado ? "text-rose-500" : ""}`} />
              <span>Gafete</span>
            </div>
            <AddBadgeModal
              title="Agregar Gafete"
              status={item.status_gafete ?? ""}
              id_bitacora={item._id}
              tipo_movimiento={item.tipo_movimiento ?? ""}
              ubicacion={location}
              area={area}
              modalAgregarBadgeAbierto={modalBadgeOpen}
              setModalAgregarBadgeAbierto={setModalBadgeOpen}
              pase_id={item.pase_id ?? item._id}
            />
          </>
        )}

        {/* Salida */}
        {hasSalida ? (
          <div className={iconClass(true)} title="Salida ya registrada">
            <Forward className="w-5 h-5" />
            <span>Salida</span>
          </div>
        ) : (
          <>
            <div
              className={iconClass(false)}
              title="Registrar salida"
              onClick={() => setModalSalidaOpen(true)}
            >
              <Forward className="w-5 h-5 text-emerald-500" />
              <span>Salida</span>
            </div>
            <DoOutModal
              title="Registrar Salida"
              id_bitacora={item._id}
              ubicacion={location}
              area={area}
              fecha_salida={item.fecha_salida ?? ""}
              modalSalidaAbierto={modalSalidaOpen}
              setModalSalidaAbierto={setModalSalidaOpen}
            />
          </>
        )}
      </div>
    </div>
  );
};

export const ActivePassesModal: React.FC<ActivePassesModalProps> = ({
  title,
  children,
  open,
  setOpen,
  input,
}) => {
  const { location, area } = useBoothStore();
  const { setPassCode, passCode } = useAccessStore();
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: activePasses, isLoadingPasses } = usePasses(location ?? "");

  useEffect(() => {
    if (open) {
      setSearchText(input);
    } else {
      const timeout = setTimeout(() => setSearchText(""), 300);
      return () => clearTimeout(timeout);
    }
  }, [open, input]);

  const filteredTemporaryPasses = (search: string) =>
    activePasses?.filter((item: any) =>
      item.nombre?.toLowerCase().includes(search?.toLowerCase())
    );

  const handleSelectPass = (item: any) => {
    if (esHexadecimal(item._id) && item._id !== passCode) {
      setSelectedId(item._id);
      setPassCode(item._id);
      setSearchText("");
      setOpen(false);
    } else {
      toast.error("Escoge un pase diferente...");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-5xl w-full flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {title}
          </DialogTitle>
          <p className="text-sm text-slate-500">Selecciona visitantes para gestionar</p>
        </DialogHeader>

        {isLoadingPasses ? (
          <div className="flex flex-col justify-center items-center min-h-[40vh]">
            <div className="mb-3 font-semibold text-gray-500">
              Cargando información...
            </div>
            <div className="w-16 h-16 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto mt-2">
              {filteredTemporaryPasses(searchText)?.length === 0 ? (
                <div className="text-center text-lg text-gray-500 py-10">
                  No hay resultados disponibles
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                  {filteredTemporaryPasses(searchText)?.map((item: any) => (
                    <PassCard
                      key={item._id}
                      item={item}
                      isSelected={selectedId === item._id}
                      onSelect={handleSelectPass}
                      area={area ?? ""}
                      location={location ?? ""}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
