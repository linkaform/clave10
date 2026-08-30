/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  aceptarInvitacionSdk,
  AltaContratista,
  checkInvitacionSdk,
  ContratistaRecord,
  crearCuentaContratistaSdk,
  getContratistaByIdSdk,
  InvitacionCheck,
  PerfilContratista,
  updateContratistaSdk,
} from "@/lib/contratistas-sdk";
import { errorMsj } from "@/lib/utils";

const errorRojo = {
  style: { background: "#dc2626", color: "#fff", border: "none" },
};

/** errorMsj regresa undefined cuando no hay error; si hay, se lanza con su .text */
const unwrap = (res: any, fallback: string) => {
  const msj = errorMsj(res);
  if (msj) {
    throw new Error(msj.text || fallback);
  }
  return res?.response?.data ?? null;
};

/**
 * Compuerta de identidad. Se habilita solo cuando ya se leyeron los parametros
 * de la URL, porque necesita record_id + account_id + el correo invitado.
 */
export const useCheckInvitacion = (
  record_id: string,
  email: string,
  account_id: number,
  enabled: boolean,
) => {
  const { data, isLoading, error, refetch } = useQuery<InvitacionCheck | null>({
    queryKey: ["checkInvitacion", record_id, email, account_id],
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await checkInvitacionSdk(record_id, email, account_id);
      return unwrap(res, "No pudimos validar tu invitación");
    },
  });

  return { invitacion: data, isLoadingInvitacion: isLoading, errorInvitacion: error, refetchInvitacion: refetch };
};

/** Detalle del registro, para precargar los pasos de perfil y documentos. */
export const useGetContratista = (
  record_id: string,
  account_id: number,
  jwt: string,
  enabled: boolean,
) => {
  const { data, isLoading, refetch } = useQuery<ContratistaRecord | null>({
    queryKey: ["getContratista", record_id, account_id],
    enabled: enabled && !!record_id && !!jwt,
    retry: false,
    queryFn: async () => {
      const res = await getContratistaByIdSdk(record_id, account_id, jwt);
      return unwrap(res, "No pudimos obtener tu solicitud");
    },
  });

  return { contratista: data, isLoadingContratista: isLoading, refetchContratista: refetch };
};

export const useAceptarInvitacion = () => {
  const [isLoading, setIsLoading] = useState(false);

  const aceptarMutation = useMutation({
    mutationFn: async ({
      record_id,
      account_id,
      jwt,
    }: {
      record_id: string;
      account_id: number;
      jwt: string;
    }) => {
      const res = await aceptarInvitacionSdk(record_id, account_id, jwt);
      return unwrap(res, "No pudimos registrar tu aceptación");
    },
    onMutate: () => setIsLoading(true),
    onSuccess: () => toast.success("¡Invitación aceptada!"),
    onError: (err) => toast.error(err.message, errorRojo),
    onSettled: () => setIsLoading(false),
  });

  return { aceptarMutation, isLoadingAceptar: isLoading };
};

export const useUpdateContratista = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({
      record_id,
      account_id,
      data,
      jwt,
    }: {
      record_id: string;
      account_id: number;
      data: PerfilContratista;
      jwt: string;
    }) => {
      const res = await updateContratistaSdk(record_id, account_id, data, jwt);
      return unwrap(res, "No pudimos guardar tu información");
    },
    onMutate: () => setIsLoading(true),
    onError: (err) => toast.error(err.message, errorRojo),
    onSettled: () => setIsLoading(false),
  });

  return { updateMutation, isLoadingUpdate: isLoading };
};

export const useCrearCuentaContratista = () => {
  const [isLoading, setIsLoading] = useState(false);

  const crearCuentaMutation = useMutation({
    mutationFn: async ({
      account_id,
      data,
    }: {
      account_id: number;
      data: Parameters<typeof crearCuentaContratistaSdk>[1];
    }) => {
      const res = await crearCuentaContratistaSdk(account_id, data);
      // unwrap solo lanza cuando el backend mando un error de verdad. Un
      // username ocupado NO lo es: viene como 200 con username_ocupado, y lo
      // resuelve la pantalla ofreciendo sugerencias.
      return unwrap(res, "No pudimos crear tu cuenta") as AltaContratista | null;
    },
    onMutate: () => setIsLoading(true),
    onError: (err) => toast.error(err.message, errorRojo),
    onSettled: () => setIsLoading(false),
  });

  return { crearCuentaMutation, isLoadingCrearCuenta: isLoading };
};
