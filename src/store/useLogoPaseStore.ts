import { create } from "zustand";

// HeaderPase lo renderiza el layout de la ruta (pase-update/registro-ingreso/
// reset), que en Next.js App Router no recibe props de la página — por eso
// el logo del back se pasa por acá en vez de como prop.
interface LogoPaseState {
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

export const useLogoPaseStore = create<LogoPaseState>((set) => ({
  logoUrl: null,
  setLogoUrl: (logoUrl) => set({ logoUrl }),
}));
