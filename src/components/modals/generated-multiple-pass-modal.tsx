import { CheckCircleIcon, Copy, X } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

interface GeneratedMultiplePassModalProps {
  title: string;
  description: string;
  links: { nombre: string; link: string }[];
  openGeneratedPass: boolean;
  setOpenGeneratedPass: Dispatch<SetStateAction<boolean>>;
  from?: string;
}

export const GeneratedMultiplePassModal: React.FC<GeneratedMultiplePassModalProps> = ({
  title,
  description,
  links,
  openGeneratedPass,
  setOpenGeneratedPass,
  from = "",
}) => {
  const router = useRouter();

  if (!openGeneratedPass) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast("¡Enlace copiado!", {
        description: "El enlace ha sido copiado correctamente al portapapeles.",
        action: {
          label: "Abrir enlace",
          onClick: () => window.open(url, "_blank"),
        },
      });
    });
  };

  const handleClose = () => {
    setOpenGeneratedPass(false);
    if (from === "historial") {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      router.push(`/dashboard/pases`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="absolute inset-0" onClick={(e) => e.preventDefault()} />
      <div
        className="relative bg-white rounded-2xl max-w-xl w-full p-6 flex flex-col max-h-[90vh] z-10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 rounded-sm flex items-center justify-center h-6 w-6 text-slate-400 opacity-70 hover:opacity-100 hover:bg-slate-100 transition-all focus:outline-none"
          onClick={() => setOpenGeneratedPass(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="text-center flex-shrink-0 mt-2 mb-4">
          <h2 className="text-2xl font-bold inline-flex items-center justify-center gap-2">
            {title}
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          </h2>
        </div>

        <div className="px-6 text-center mb-2 flex-shrink-0">
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        <Separator className="my-2" />

        <div className="overflow-y-auto px-2 space-y-3 my-2 min-h-0">
          {links.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 gap-3 hover:border-slate-200 transition-colors">
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invitado {idx + 1}</span>
                <span className="text-sm font-bold text-slate-700 truncate">{item.nombre}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-3 bg-white text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 shrink-0 w-full sm:w-auto shadow-sm"
                onClick={() => handleCopy(item.link)}
              >
                <Copy size={16} className="mr-2" />
                Copiar Enlace
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="mt-4 text-gray-700 bg-gray-100 hover:bg-gray-200 border-transparent font-medium py-5 flex-shrink-0"
          onClick={handleClose}
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};
