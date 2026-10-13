import { CheckCircleIcon, Copy, Download, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { getImgPassUrl } from "@/lib/endpoints";

interface GeneratedPassModalProps {
  title: string;
  description: string;
  link: string;
  openGeneratedPass: boolean;
  setOpenGeneratedPass: Dispatch<SetStateAction<boolean>>;
  from:string
  /** Con recordId (id del pase creado) se ofrece "Copiar link y descargar pase". */
  recordId?: string;
  accountId?: number;
}

// Descarga la imagen del pase (get_pass_img, igual que view-pass-modal).
const descargarImagenPase = async (accountId: number, recordId: string) => {
  const res = await getImgPassUrl(accountId, recordId);
  const imgUrl = res?.response?.data || "";
  if (!imgUrl) throw new Error("No hay imagen del pase disponible");
  const response = await fetch(imgUrl);
  if (!response.ok) throw new Error("No se pudo obtener la imagen");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pase.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const GeneratedPassModal: React.FC<GeneratedPassModalProps> = ({
  title,
  description,
  link,
  openGeneratedPass,
  setOpenGeneratedPass,
  from="",
  recordId,
  accountId,
}) => {
  const router = useRouter();
  const [descargando, setDescargando] = useState(false);

  const salir = () => {
    setOpenGeneratedPass(false);
    if (from == "historial") {
      setTimeout(() => window.location.reload(), 1000);
    } else {
      router.push(`/dashboard/pases`);
    }
  };

  const handleCopiarYDescargar = async () => {
    // El portapapeles va primero, mientras sigue vivo el gesto del clic.
    navigator.clipboard.writeText(link).catch(() => {});
    setDescargando(true);
    try {
      await descargarImagenPase(accountId ?? 0, recordId ?? "");
      toast.success("Enlace copiado y pase descargado.");
      salir();
    } catch (error) {
      toast.error(`Enlace copiado, pero no se pudo descargar el pase: ${(error as Error).message}`);
    } finally {
      setDescargando(false);
    }
  };

  if (!openGeneratedPass) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="absolute inset-0"
        onClick={(e) => e.preventDefault()}
      />
      <div
        className="relative bg-white rounded-2xl max-w-xl w-full p-6 flex flex-col max-h-[90vh] overflow-y-auto z-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => setOpenGeneratedPass(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="text-center flex-shrink-0 my-5">
          <h2 className="text-2xl font-bold inline-block">
            {title}
            <CheckCircleIcon className="h-6 w-6 text-green-500 ml-2 inline-block" />
          </h2>
        </div>

        <div className="px-16 text-center">
          <p>{description}</p>
        </div>

        <Separator className="my-3" />

        <div className="flex justify-center m-3">
          <input
            className="text-gray-600 text-center w-1/2"
            disabled
            type="text"
            value={link}
          />
        </div>

        <Button
          variant="link"
          className="text-blue-600 hover:text-blue-800"
          onClick={() => {
            navigator.clipboard.writeText(link).then(() => {
              toast("¡Enlace copiado!", {
                description:
                  "El enlace ha sido copiado correctamente al portapapeles.",
                action: {
                  label: "Abrir enlace",
                  onClick: () => window.open(link, "_blank"),
                },
              });
            });
            setOpenGeneratedPass(false);
            if(from=="historial"){
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }else{
              router.push(`/dashboard/pases`);
            }
          }}
        >
          <Copy className="mr-2" />
          Copiar Enlace
        </Button>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={() => { router.push(`/dashboard/pases`);}}
            disabled={descargando}
          >
            Cerrar
          </Button>
          {recordId && (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCopiarYDescargar}
              disabled={descargando}
            >
              {descargando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {descargando ? "Descargando..." : "Copiar link y descargar pase"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
