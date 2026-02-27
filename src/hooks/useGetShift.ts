/* eslint-disable @typescript-eslint/no-explicit-any */
import { closeShift } from "@/lib/close-shift";
import { getShift } from "@/lib/get-shift";
import { startShift } from "@/lib/start-shift";
import { toast } from "sonner";
import { useShiftStore } from "@/store/useShiftStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { errorMsj } from "@/lib/utils";
import { Imagen } from "@/components/upload-Image";
import { useEffect, useRef } from "react";
import { useBoothStore } from "@/store/useBoothStore";

export const useGetShift = (area?: string,
  location?: string) => {
  const { setCheckin_id } = useShiftStore();
  const { setBooth } = useBoothStore()
  const setBoothRef = useRef(setBooth);
  const setCheckin_idRef = useRef(setCheckin_id);

  useEffect(() => { setBoothRef.current = setBooth; }, [setBooth]);
  useEffect(() => { setCheckin_idRef.current = setCheckin_id; }, [setCheckin_id]);

  // const {
  //   area,
  //   location,
  //   isLoading
  //   setCheckin_id,
  //   setArea,
  //   setLocation,
  //   setTurno,
  //   setDownloadPass
  // } = useShiftStore();

  const {
    data: allData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<any>({
    queryKey: ["getShift", area, location],
    enabled: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const params: { area?: string; location?: string } = { area, location };
      const data = await getShift(params);
      const hasError = (!data?.success) || (data?.response?.data?.status_code === 400)
      if (hasError) {
        const textMsj = errorMsj(data)
        toast.error(`Error al obtener load shift, Error: ${textMsj?.text}`);
      }
      return data
    }
  });

  const shift = allData?.response?.data;

  useEffect(() => {
    if (shift?.location?.name || shift?.guard?.location) {
      setBoothRef.current(
        shift?.location?.area || shift?.guard?.area,
        shift?.location?.name || shift?.guard?.location
      );
    }
    if (shift?.id) {
      setCheckin_idRef.current(shift?.id);
    }
  }, [shift?.id, shift?.location?.name, shift?.guard?.location, shift?.location?.area, shift?.guard?.area]);

  useEffect(() => {
    if (shift?.guard?.config_exception) {
      toast.warning(shift.guard.config_exception.msg, {
        duration: 6000,
        style: {
          background: "#FEF08A",
          color: "#854D0E",
          border: "1px solid #EAB308",
        },
      });
    }
  }, [shift?.guard?.config_exception]);

  return {
    shift,
    isLoading,
    error,
    isFetching,
    refetch,
    turno: shift?.guard?.status_turn === "Turno Abierto",
    downloadPass: shift?.booth_config ?? [],
    area: shift?.location?.area,
    location: shift?.location?.name || shift?.guard?.location,
    allData
  };
};

export const useStartShift = () => {
  const queryClient = useQueryClient();
  const { area, location } = useBoothStore();
  return useMutation({
    mutationFn: async ({
      employee_list,
      fotografia,
      nombre_suplente,
      checkin_id,
    }: {
      employee_list?: { user_id: number; name: string }[];
      fotografia: Imagen[];
      nombre_suplente: string;
      checkin_id?: string;
    }) => {
      const params: any = {
        employee_list,
        fotografia,
        nombre_suplente,
        checkin_id,
      };

      if (area) params.area = area;
      if (location) params.location = location;

      const response = await startShift(params);

      const hasError = !response?.success || response?.response?.data?.status_code === 400;

      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(textMsj?.text || "Error al iniciar turno");
      }

      return response.response?.data;
    },
    onSuccess: (response: any) => {
      console.log("response", response)
      // const checkin_id = response?.response?.data?.json?.id || response?.id;
      // if (checkin_id) {
      //   setCheckin_id(checkin_id);
      // }

      queryClient.invalidateQueries({ queryKey: ["getShift"] });
      queryClient.invalidateQueries({ queryKey: ["getGuardSupport"] });

      toast.success("Turno iniciado correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al iniciar el turno.", {
        style: {
          background: "#DC2626",
          color: "white",
        },
      });
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();
  const { area, location } = useBoothStore();

  return useMutation({
    mutationFn: async ({
      fotografia,
      checkin_id
    }: {
      fotografia: Imagen[];
      checkin_id: string | undefined;
    }) => {
      const params: any = {
        checkin_id,
        fotografia,
      };
      if (area) params.area = area;
      if (location) params.location = location;

      const response = await closeShift(params);

      const hasError = !response?.success || response?.response?.data?.status_code === 400;

      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(textMsj?.text || "Error al cerrar turno");
      }

      return response.response?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getShift"] });

      toast.success("Turno cerrado correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al cerrar el turno.");
    },
  });
};

export const useForceCloseShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      area,
      location,
      checkin_id,
    }: {
      area?: string;
      location?: string;
      checkin_id: string;
    }) => {
      const params: any = { checkin_id };
      if (area) params.area = area;
      if (location) params.location = location;

      const response = await closeShift(params);

      const hasError = !response?.success || response?.response?.data?.status_code === 400;

      if (hasError) {
        const textMsj = errorMsj(response);
        throw new Error(textMsj?.text || "Error al forzar cierre de turno");
      }

      return response.response?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["getShift", variables.area || "", variables.location || ""]
      });

      toast.success("El cierre forzado se ejecutó con éxito.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Hubo un error al cerrar el turno.");
    }
  });
};