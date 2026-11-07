"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getMassShare,
  listMassShare,
  MassShareJob,
  pauseMassShare,
  planMassShare,
  resendMassShare,
  runMassShare,
  verifyMassShare,
} from "@/services/menus-admin";
import { ApiResponse } from "@/types/api";

// Un share puede tardar minutos en verse: el back solo verifica envios de hace 10 min.
export const VERIFICAR_MIN = 10;
const ABIERTOS = ["planeando", "listo", "corriendo", "pausado", "enviado"];

const datos = <T,>(res: ApiResponse | undefined, accion: string): T => {
  const data = res?.response?.data as (T & { error?: string }) | undefined;
  if (!res?.success || !data) throw new Error(`No se pudo ${accion}.`);
  if (data.error) throw new Error(data.error);
  return data;
};

const dormir = (seg: number, detener: () => boolean) =>
  new Promise<void>((resolve) => {
    let restante = seg;
    const tick = setInterval(() => {
      restante -= 1;
      if (restante <= 0 || detener()) {
        clearInterval(tick);
        resolve();
      }
    }, 1000);
  });

/**
 * Corre el compartir masivo desde el navegador: el trabajo vive en Mongo y el front va
 * llamando un item a la vez, respetando el intervalo que regresa el back. Si se cierra la
 * pestana, el trabajo queda como estaba y se retoma al volver.
 */
export const useMassShare = () => {
  const [job, setJob] = useState<MassShareJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [espera, setEspera] = useState(0);
  const [porConfirmar, setPorConfirmar] = useState<{ key: string; msg: string } | null>(null);
  const detenerRef = useRef(false);

  const refrescar = useCallback(async (jobId: string) => {
    const data = datos<MassShareJob>(await getMassShare(jobId), "leer el trabajo");
    setJob(data);
    return data;
  }, []);

  // Al abrir: retoma el ultimo trabajo sin terminar, si hay.
  const cargarUltimo = useCallback(async () => {
    setIsLoading(true);
    try {
      const lista = datos<MassShareJob[]>(await listMassShare(), "leer los trabajos");
      // Solo trabajos recientes (el back no corre planes de mas de 24 h) que tengan algo
      // por mandar, por armar o envios sin verificar.
      const desde = Date.now() / 1000 - 24 * 3600;
      const abierto = lista.find(
        (j) =>
          ABIERTOS.includes(j.estado) &&
          (j.created_at ?? 0) >= desde &&
          (j.estado === "planeando" || j.pendientes > 0 || (j.enviados > 0 && j.ok + j.faltan < j.enviados)),
      );
      if (abierto) await refrescar(abierto.job_id);
    } catch (err) {
      console.warn("list_mass_share", err);
    } finally {
      setIsLoading(false);
    }
  }, [refrescar]);

  useEffect(() => {
    cargarUltimo();
  }, [cargarUltimo]);

  const planear = useCallback(async (userIds?: number[]) => {
    setIsPlanning(true);
    setPorConfirmar(null);
    try {
      let data = datos<MassShareJob>(await planMassShare(undefined, userIds), "armar el plan");
      setJob(data);
      while (data.estado === "planeando") {
        data = datos<MassShareJob>(await planMassShare(data.job_id), "armar el plan");
        setJob(data);
      }
      data = await refrescar(data.job_id);
      if (data.pendientes === 0) toast.success("No hay nada que compartir: todos tienen sus permisos.");
      else toast.success(`Plan listo: ${data.pendientes} shares en ${data.items_pendientes} ítem(s).`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsPlanning(false);
    }
  }, [refrescar]);

  const correr = useCallback(
    async (intervalo: number, confirmarPrimero = false) => {
      if (!job) return;
      detenerRef.current = false;
      setIsRunning(true);
      setPorConfirmar(null);
      let confirmar = confirmarPrimero;
      let fallidas = job.llamadas_fallidas;
      let llamadas = job.llamadas;
      try {
        while (!detenerRef.current) {
          const res = datos<MassShareJob>(await runMassShare(job.job_id, intervalo, confirmar), "mandar el ítem");
          // La confirmacion vale para el item que la pidio: se gasta cuando sale una llamada
          // (si el back respondio "espera el intervalo", sigue en pie).
          if (res.llamadas > llamadas) {
            confirmar = false;
            llamadas = res.llamadas;
          }
          if (res.requiere_confirmar) {
            setPorConfirmar({ key: res.requiere_confirmar, msg: res.msg ?? "" });
            break;
          }
          const actual = await refrescar(job.job_id);
          if (actual.llamadas_fallidas > fallidas) {
            toast.error("Una llamada no regresó 2xx: se detuvo. Revisa y verifica antes de seguir.");
            break;
          }
          fallidas = actual.llamadas_fallidas;
          if (actual.estado === "enviado" || actual.items_pendientes === 0) {
            toast.success(`Todo enviado. Verifica en ${VERIFICAR_MIN} minutos.`);
            break;
          }
          if (actual.estado === "pausado") break;
          const seg = res.espera_seg ?? intervalo;
          if (seg > 0) {
            setEspera(seg);
            await dormir(seg, () => detenerRef.current);
            setEspera(0);
          }
        }
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setEspera(0);
        setIsRunning(false);
      }
    },
    [job, refrescar],
  );

  // Se detiene antes de la siguiente llamada; la que esta en curso termina.
  const pausar = useCallback(async () => {
    if (!job) return;
    detenerRef.current = true;
    try {
      datos<MassShareJob>(await pauseMassShare(job.job_id), "pausar");
      await refrescar(job.job_id);
      toast.info("Pausado. La llamada en curso termina y no se manda la siguiente.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [job, refrescar]);

  const verificar = useCallback(async () => {
    if (!job) return;
    setIsVerifying(true);
    try {
      const res = datos<MassShareJob>(await verifyMassShare(job.job_id), "verificar");
      const actual = await refrescar(job.job_id);
      if (res.msg) toast.info(res.msg);
      else if (actual.faltan > 0) toast.warning(`${actual.faltan} share(s) no se aplicaron.`);
      else toast.success(`Verificado: ${actual.ok} share(s) aplicados.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsVerifying(false);
    }
  }, [job, refrescar]);

  const reenviar = useCallback(async () => {
    if (!job) return;
    try {
      datos<MassShareJob>(await resendMassShare(job.job_id), "regresar los faltantes");
      await refrescar(job.job_id);
      toast.success("Faltantes regresados a pendientes. Inicia de nuevo para mandarlos.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [job, refrescar]);

  const cerrar = useCallback(() => {
    setJob(null);
    setPorConfirmar(null);
  }, []);

  return {
    job,
    isLoading,
    isPlanning,
    isRunning,
    isVerifying,
    espera,
    porConfirmar,
    planear,
    correr,
    pausar,
    verificar,
    reenviar,
    cerrar,
  };
};
