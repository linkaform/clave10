"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ListChecks, Loader2, Pause, Play, RotateCcw, Share2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMassShare, VERIFICAR_MIN } from "@/hooks/menus-admin/useMassShare";
import { MassShareEstado, PermissionItemType } from "@/services/menus-admin";

const TIPO_LABEL: Record<PermissionItemType, string> = {
  script: "Script",
  catalog: "Catálogo",
  form: "Forma",
};

const ESTADO_LABEL: Record<MassShareEstado, string> = {
  planeando: "Armando plan",
  listo: "Plan listo",
  corriendo: "Enviando",
  pausado: "Pausado",
  enviado: "Enviado, falta verificar",
  terminado: "Terminado",
};

const INTERVALOS = [10, 30, 60];

const minutos = (seg?: number | null) => {
  if (seg == null) return "—";
  if (seg < 1) return "<1 s";
  if (seg < 60) return `${Math.round(seg)} s`;
  return `${Math.round(seg / 60)} min`;
};

// Compartir masivo (1509): reemplaza el "Reaplicar todos", que compartia usuario por
// usuario. Aqui va un item por llamada con todos sus usuarios, con intervalo entre llamadas.
export const MassShareSection = () => {
  const {
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
  } = useMassShare();
  const [intervalo, setIntervalo] = useState(30);
  const [ahora, setAhora] = useState(() => Date.now() / 1000);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now() / 1000), 15000);
    return () => clearInterval(t);
  }, []);

  const ocupado = isPlanning || isRunning || isVerifying;
  const verificarDesde = job?.ultimo_envio_at ? job.ultimo_envio_at + VERIFICAR_MIN * 60 : null;
  const puedeVerificar =
    !!job && job.enviados > 0 && !!verificarDesde && ahora >= verificarDesde && job.items_pendientes === 0;
  const detalle = job?.detalle ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold">Compartir masivo</h2>
          <p className="text-sm text-muted-foreground">
            Revisa qué le falta a cada usuario según sus menús y lo comparte un ítem a la vez,
            con todos los usuarios que lo necesitan en una sola llamada y una pausa entre
            llamadas. Las formas con muchos catálogos se parten para no pasar de ~3 min por
            llamada. La página debe quedarse abierta mientras envía.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!job && (
            <Button size="sm" variant="outline" onClick={() => planear()} disabled={ocupado || isLoading}>
              {isPlanning ? <Loader2 size={14} className="animate-spin" /> : <ListChecks size={14} />}
              {isPlanning ? "Armando plan..." : "Armar plan"}
            </Button>
          )}
          {job && !ocupado && (
            <Button size="sm" variant="ghost" onClick={cerrar}>
              <X size={14} />
              Cerrar
            </Button>
          )}
        </div>
      </div>

      {isLoading && !job ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Buscando trabajos sin terminar...</div>
      ) : isPlanning && !job ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Revisando qué le falta a cada usuario... puede tardar en cuentas con muchos usuarios.
        </div>
      ) : !job ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Presiona &quot;Armar plan&quot; para ver qué falta compartir en la cuenta. Solo lee; no
          manda nada hasta que inicies.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{ESTADO_LABEL[job.estado] ?? job.estado}</Badge>
            {job.estado === "planeando" ? (
              <span className="text-muted-foreground">
                Revisados {job.revisados} de {job.usuarios} usuario(s)...
              </span>
            ) : (
              <span className="text-muted-foreground">
                {job.usuarios} usuario(s) · {job.pendientes} share(s) pendientes en {job.items_pendientes} ítem(s)
                {job.pendientes > 0 &&
                  ` · ~${job.llamadas_estimadas ?? "?"} llamada(s), ~${job.estimado_min} min de envío más las pausas`}
                {job.enviados > 0 && ` · ${job.enviados} enviados en ${job.llamadas} llamada(s)`}
                {job.llamadas_fallidas > 0 && ` · ${job.llamadas_fallidas} llamada(s) fallida(s)`}
                {(job.ok > 0 || job.faltan > 0) && ` · verificados ${job.ok}, faltan ${job.faltan}`}
                {job.sin_lectura.length > 0 && ` · ${job.sin_lectura.length} usuario(s) no se pudieron leer`}
              </span>
            )}
          </div>

          {job.estado !== "planeando" && (
            <div className="flex flex-wrap items-center gap-2">
              {job.pendientes > 0 && !isRunning && (
                <>
                  <Select value={String(intervalo)} onValueChange={(v) => setIntervalo(Number(v))}>
                    <SelectTrigger className="w-[170px] h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVALOS.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {`${s} s entre llamadas`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => correr(intervalo)}
                    disabled={ocupado}>
                    <Play size={14} />
                    {job.enviados > 0 ? "Reanudar" : "Iniciar"}
                  </Button>
                </>
              )}
              {isRunning && (
                <>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    {espera > 0 ? `Siguiente llamada en ${espera} s...` : "Mandando ítem (puede tardar hasta ~3 min)..."}
                  </span>
                  <Button size="sm" variant="outline" onClick={pausar}>
                    <Pause size={14} />
                    Pausar
                  </Button>
                </>
              )}
              {job.enviados > 0 && job.items_pendientes === 0 && job.estado !== "terminado" && !isRunning && (
                <Button size="sm" variant="outline" onClick={verificar} disabled={!puedeVerificar || ocupado}>
                  {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                  {isVerifying
                    ? "Verificando..."
                    : puedeVerificar || !verificarDesde
                      ? "Verificar"
                      : `Verificar desde las ${new Date(verificarDesde * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </Button>
              )}
              {job.faltan > 0 && !isRunning && (
                <Button size="sm" variant="outline" onClick={reenviar} disabled={ocupado}>
                  <RotateCcw size={14} />
                  Reenviar faltantes ({job.faltan})
                </Button>
              )}
            </div>
          )}

          {porConfirmar && (
            <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-sm flex items-center justify-between gap-4">
              <span>{porConfirmar.msg}</span>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => correr(intervalo, true)}>
                  <Share2 size={14} />
                  Confirmar y seguir
                </Button>
              </div>
            </div>
          )}

          {detalle.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ítem</TableHead>
                    <TableHead>Usuarios pendientes</TableHead>
                    <TableHead>Llamadas</TableHead>
                    <TableHead>Estimado</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Verificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalle.map((d) => (
                    <TableRow key={d.item}>
                      <TableCell>
                        <span className="text-xs text-muted-foreground mr-2">{TIPO_LABEL[d.tipo] ?? d.tipo}</span>
                        {d.nombre}
                        {d.tipo === "form" && d.catalogos != null && (
                          <span className="text-xs text-muted-foreground"> · {d.catalogos} catálogo(s)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.pendientes}
                        {d.grande && <span className="text-xs text-amber-700"> · pide confirmar</span>}
                      </TableCell>
                      <TableCell>
                        {d.llamadas}
                        {d.pendientes > 0 && d.llamadas_estimadas != null && ` (+${d.llamadas_estimadas})`}
                        {d.llamadas_fallidas > 0 && <span className="text-red-600"> · {d.llamadas_fallidas} fallida(s)</span>}
                      </TableCell>
                      <TableCell>{d.pendientes > 0 ? minutos(d.seg_estimados) : "—"}</TableCell>
                      <TableCell>
                        {d.enviados}
                        {d.segundos > 0 && <span className="text-xs text-muted-foreground"> · {minutos(d.segundos)}</span>}
                      </TableCell>
                      <TableCell>
                        {d.ok > 0 && <span className="text-green-700">{d.ok} ok</span>}
                        {d.faltan.length > 0 && <span className="text-red-600"> · faltan {d.faltan.length}</span>}
                        {d.ok === 0 && d.faltan.length === 0 && "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
