import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import SearchInput from "../search-input";
import { useQuery } from "@tanstack/react-query";
import { useAccessStore } from "@/store/useAccessStore";
import { fetchTemporalPasses } from "@/lib/access";
import { useState } from "react";
import Image from "next/image";
import { useBoothStore } from "@/store/useBoothStore";
import { ArrowRight } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const TemporaryPassesModal: React.FC<Props> = ({ title, children }) => {
  const { setPassCode } = useAccessStore();
  const { area, location } = useBoothStore();
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);

  const { data: temporaryPasses, isLoading } = useQuery<any>({
    queryKey: ["getTemporaryPasses"],
    enabled: Boolean(area && location && open),
    queryFn: async () => {
      const data = await fetchTemporalPasses({
        area,
        location,
        inActive: "true",
      });
      return data.response?.data || [];
    },
    refetchOnWindowFocus: false,
    // refetchInterval: 60000,
    refetchOnReconnect: true,
    // staleTime: 1000 * 60 * 5,
  });

  const filteredTemporaryPasses = temporaryPasses?.filter((item: any) =>
    item?.nombre?.toLowerCase().includes(searchText?.toLowerCase())
  );

  // url_padre solo trae el link (ej: ".../records/detail/<id>"); para abrir
  // la pantalla de accesos con ese pase, sacamos el último segmento de la URL.
  const extraerIdDeUrl = (url?: string): string | null => {
    if (!url) return null;
    const partes = url.split("/").filter(Boolean);
    return partes[partes.length - 1] || null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold my-5">
            {title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="w-16 h-16 border-8 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <SearchInput
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto max-h-[500px] space-y-0 border-t border-b mt-2">
              {filteredTemporaryPasses?.map((item: any) => {
                const avatarUrl = item?.foto?.[0]?.file_url || "/nouser.svg";
                const esVinculado = !!item.tiene_padre;

                return (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between px-4 py-4 border-b cursor-pointer transition-colors ${
                      esVinculado ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setPassCode(item._id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div
                        className={`relative w-14 h-14 rounded-full overflow-hidden border-2 shrink-0 ${
                          esVinculado ? "border-blue-300" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={avatarUrl}
                          alt={item.nombre || "Sin nombre"}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {item.nombre || (
                            <span className="text-gray-400 font-normal">Sin nombre</span>
                          )}
                        </p>
                        {esVinculado && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Pase vinculado
                          </span>
                        )}
                      </div>
                    </div>

                    {esVinculado && item.url_padre && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const padreId = extraerIdDeUrl(item.url_padre);
                          if (padreId) {
                            setPassCode(padreId);
                            setOpen(false);
                          }
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors ml-3"
                      >
                        Ver pase padre
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};