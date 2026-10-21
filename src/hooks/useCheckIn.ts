import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { create } from "zustand";
import { useAsistencia } from "./useAsistencia";
import { doCheckIn, doCheckOut, getBoothConfig, getCheckIn, getLugares, getRolesCheckIn } from "@/lib/asistencia-sdk";

export const CHECKIN_KEY = ["checkin"];

// El asistente se abre desde el inicio y desde el menú del avatar; vive una vez en el header.
export const useCheckInWizard = create<{
  // "asistencia": confirma marcar asistencia antes del Check In (quien está Ausente).
  mode: "asistencia" | "checkin" | "checkout" | null;
  open: (mode: "asistencia" | "checkin" | "checkout") => void;
  close: () => void;
}>((set) => ({
  mode: null,
  open: (mode) => set({ mode }),
  close: () => set({ mode: null }),
}));

export const useCheckIn = () => {
  const { data, isLoading } = useQuery({
    queryKey: CHECKIN_KEY,
    queryFn: getCheckIn,
    staleTime: 1000 * 60,
  });
  return { checkIn: data ?? null, isLoading };
};

export const useLugaresCheckIn = (enabled: boolean) =>
  useQuery({ queryKey: ["checkin-lugares"], queryFn: getLugares, enabled, staleTime: 0 });

export const useRolesCheckIn = (enabled: boolean) =>
  useQuery({ queryKey: ["checkin-roles"], queryFn: getRolesCheckIn, enabled, staleTime: 1000 * 60 * 10 });

export const useBoothConfig = (location?: string) =>
  useQuery({
    queryKey: ["booth-config", location],
    queryFn: () => getBoothConfig(location!),
    enabled: !!location,
    staleTime: 1000 * 60 * 10,
  });

export const useCheckInMutations = () => {
  const queryClient = useQueryClient();
  const onSuccess = (msg: string) => (res: Awaited<ReturnType<typeof getCheckIn>>) => {
    queryClient.setQueryData(CHECKIN_KEY, res);
    queryClient.invalidateQueries({ queryKey: ["checkin-lugares"] });
    toast.success(msg);
  };
  const onError = (e: Error) => toast.error(e.message);

  const checkIn = useMutation({
    mutationFn: doCheckIn,
    onSuccess: (res) =>
      onSuccess(`Se registró tu Check In en ${res?.ubicacion} · ${res?.caseta}`)(res),
    onError,
  });
  const checkOut = useMutation({
    mutationFn: doCheckOut,
    onSuccess: onSuccess("Se registró tu Check Out"),
    onError,
  });
  return { checkIn, checkOut };
};

// Botón de Check In / Check Out (inicio y avatar): abre el asistente que toca.
export const useCheckInAction = () => {
  const { checkIn } = useCheckIn();
  const { disponible } = useAsistencia();
  const open = useCheckInWizard((s) => s.open);
  const run = () => {
    if (checkIn) return open("checkout");
    if (!disponible) return open("asistencia");
    open("checkin");
  };
  return { checkIn, run };
};
