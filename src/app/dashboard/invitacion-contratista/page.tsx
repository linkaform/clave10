"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, EyeOff, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { CountryCode } from "libphonenumber-js";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadFile from "@/components/upload-file";
import { Imagen } from "@/components/upload-Image";
import { getLogin } from "@/lib/login/get-login";
import { getValidToken } from "@/lib/login/get-valid-token";
import useAuthStore from "@/store/useAuthStore";
import {
  useAceptarInvitacion,
  useCheckInvitacion,
  useCrearCuentaContratista,
  useGetContratista,
  useUpdateContratista,
} from "@/hooks/Contratistas/useInvitacionContratista";

// De cara al contratista el producto es clave10 y nada mas: el copy nunca
// nombra a LinkaForm. El alta se hace aqui mismo, sin mandarlo a ningun lado.

// Los value del checkbox "Servicios a Prestar" vienen del XML de la forma
// (contratistas.xml) y 'construcción' conserva el acento -- no normalizar.
const SERVICIOS = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "construcción", label: "Construcción" },
  { value: "limpieza", label: "Limpieza" },
];

type Paso = "identidad" | "perfil" | "documentos" | "resumen" | "enviada";

export default function InvitacionContratistaPage() {
  // --- parametros de la liga ---
  const [recordId, setRecordId] = useState("");
  const [accountId, setAccountId] = useState(0);
  const [emailParam, setEmailParam] = useState("");
  const [paramsListos, setParamsListos] = useState(false);

  // --- identidad ---
  const { isAuth, userEmailSoter, userNameSoter, setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [jwt, setJwt] = useState<string>("");
  const [checkActivo, setCheckActivo] = useState(false);
  const [entrando, setEntrando] = useState(false);

  // --- alta de cuenta (cuando el correo no tiene cuenta) ---
  // De cara al contratista esto es su DOMINIO (<valor>.clave10.com); en la
  // plataforma sigue viajando como `username`, que es lo que pide el alta.
  const [dominio, setDominio] = useState("");
  // Ya no se consulta disponibilidad antes de crear (era un oraculo publico de
  // enumeracion). Estos dos guardan lo que el ALTA respondio al rebotar.
  // `ocupados` es la lista COMPLETA de los que rebotaron, no solo el ultimo:
  // si el contratista vuelve a teclear uno anterior, no debe gastar otro alta.
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [password2, setPassword2] = useState("");

  // --- wizard ---
  const [paso, setPaso] = useState<Paso>("identidad");

  // --- perfil ---
  const [razonSocial, setRazonSocial] = useState("");
  const [rfc, setRfc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [servicios, setServicios] = useState<string[]>([]);

  // --- documentos ---
  const [altaFiscal, setAltaFiscal] = useState<Imagen[]>([]);
  const [identificacion, setIdentificacion] = useState<Imagen[]>([]);
  const [comprobante, setComprobante] = useState<Imagen[]>([]);

  const { invitacion, isLoadingInvitacion, errorInvitacion } = useCheckInvitacion(
    recordId,
    email,
    accountId,
    checkActivo && !!recordId && !!email,
  );
  const { aceptarMutation, isLoadingAceptar } = useAceptarInvitacion();
  const { updateMutation, isLoadingUpdate } = useUpdateContratista();
  const { crearCuentaMutation, isLoadingCrearCuenta } = useCrearCuentaContratista();
  const { contratista } = useGetContratista(
    recordId,
    accountId,
    jwt,
    paso !== "identidad",
  );

  // Lee la liga: ?id=<record_id>&user=<account_id del cliente>&e=<correo>
  // Mismo patron que dashboard/pase-update/page.tsx.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    setRecordId(p.get("id") ?? "");
    setAccountId(parseInt(p.get("user") ?? "") || 0);
    const e = (p.get("e") ?? "").trim().toLowerCase();
    setEmailParam(e);
    if (e) {
      setEmail(e);
      setCheckActivo(true);
    }
    setParamsListos(true);
  }, []);

  // Si ya trae sesion y es el correo invitado, se reusa ese token.
  // OJO: nunca llamar useAuthStore().logout() en esta pagina -- hace
  // localStorage.clear() y tumbaria la sesion de un usuario interno que
  // abriera la liga por accidente.
  useEffect(() => {
    if (!isAuth || jwt) return;
    (async () => {
      const token = await getValidToken();
      if (token) setJwt(token);
    })();
  }, [isAuth, jwt]);

  const mismaCuenta = useMemo(() => {
    const invitado = (invitacion?.email || emailParam || "").toLowerCase();
    const sesion = (userEmailSoter || "").toLowerCase();
    return !!invitado && !!sesion && invitado === sesion;
  }, [invitacion?.email, emailParam, userEmailSoter]);

  // Precarga del registro cuando ya hay acceso.
  useEffect(() => {
    if (!contratista) return;
    setRazonSocial((prev) => prev || contratista.razon_social || "");
    setRfc((prev) => prev || contratista.rfc || "");
    setTelefono((prev) => prev || contratista.telefono || "");
    setServicios((prev) => (prev.length ? prev : contratista.servicios || []));
    setAltaFiscal((prev) => (prev.length ? prev : contratista.alta_fiscal || []));
    setIdentificacion((prev) => (prev.length ? prev : contratista.identificacion || []));
    setComprobante((prev) => (prev.length ? prev : contratista.comprobante_domicilio || []));
  }, [contratista]);

  const aceptar = async (token: string) => {
    try {
      const res = await aceptarMutation.mutateAsync({
        record_id: recordId,
        account_id: accountId,
        jwt: token,
      });
      if (res) setPaso("perfil");
    } catch {
      // el toast ya lo muestra onError del hook
    }
  };

  const iniciarSesion = async () => {
    if (!password) return;
    setEntrando(true);
    try {
      const res = await getLogin(email, password);
      if (!res?.success || !res?.jwt) {
        toast.error(res?.error || "Usuario o contraseña incorrectos", {
          style: { background: "#dc2626", color: "#fff", border: "none" },
        });
        return;
      }
      setAuth(
        res.jwt,
        res.session_id,
        res.user.name,
        res.user.email,
        res.user.id,
        res.user.thumb,
        res.user.parent_info.id,
      );
      setJwt(res.jwt);
      setPassword("");
      await aceptar(res.jwt);
    } catch (e: any) {
      toast.error(e?.message || "No pudimos iniciar sesión", {
        style: { background: "#dc2626", color: "#fff", border: "none" },
      });
    } finally {
      setEntrando(false);
    }
  };

  // Sesion tras el alta: se entra con el USERNAME elegido, no con el correo.
  // Es la unica cadena que garantizamos identica entre alta y login.
  const entrarConUsuario = async (usuario: string) => {
    const res = await getLogin(usuario, password);
    if (!res?.success || !res?.jwt) {
      toast.error(
        "Tu cuenta se creó, pero no pudimos iniciar sesión. Intenta entrar de nuevo.",
        { style: { background: "#dc2626", color: "#fff", border: "none" } },
      );
      return null;
    }
    setAuth(
      res.jwt,
      res.session_id,
      res.user.name,
      res.user.email,
      res.user.id,
      res.user.thumb,
      res.user.parent_info.id,
    );
    setJwt(res.jwt);
    return res.jwt;
  };

  // Mismas reglas que _clean_username en el backend: etiqueta de host, no
  // nombre de usuario -- sin punto (haria un subdominio de mas) ni guion bajo
  // (no es valido en un hostname).
  const dominioLimpio = dominio.trim().toLowerCase();
  const formatoDominioOk = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(dominioLimpio);

  const puedeRegistrarse =
    formatoDominioOk &&
    // Reintentar con el MISMO dominio que ya reboto solo gasta otro intento
    // de alta; hay que cambiarlo (o tomar una sugerencia) primero.
    !ocupados.includes(dominioLimpio) &&
    !!nombre.trim() &&
    password.length >= 8 &&
    password === password2;

  const registrarse = async () => {
    // mutateAsync RECHAZA cuando falla. El hook ya muestra el toast en onError,
    // asi que aqui solo hay que evitar la promesa sin capturar.
    let alta;
    try {
      alta = await crearCuentaMutation.mutateAsync({
        account_id: accountId,
        data: {
          record_id: recordId,
          email,
          username: dominioLimpio, // el backend lo recibe como username
          password,
          password2,
          nombre,
          apellidos,
          telefono,
        },
      });
    } catch {
      return;
    }
    if (!alta) return;

    // Rebote por username duplicado: NO es un error, es escoger otro y volver
    // a dar "crear". El backend ya manda alternativas (generadas a ciegas, sin
    // consultar disponibilidad) y se precarga la primera.
    if (alta.username_ocupado) {
      const rebotado = alta.username || dominioLimpio;
      const yaRebotados = [...ocupados, rebotado];
      // Las sugerencias se generan al azar en el backend: puede repetir una
      // que ya rebotó en un intento anterior.
      const alternativas = (alta.sugerencias ?? []).filter(
        (s) => !yaRebotados.includes(s),
      );
      setOcupados(yaRebotados);
      setSugerencias(alternativas);
      if (alternativas[0]) setDominio(alternativas[0]);
      toast.info(
        `${rebotado}.clave10.com ya está ocupado. Te propusimos otro: revísalo y vuelve a crear tu cuenta.`,
      );
      return;
    }

    // El backend responde already_exists cuando el correo o la invitacion ya
    // tenian cuenta: no es un error, es cambiar a iniciar sesion.
    if (alta.already_exists) {
      toast.info("Ya tienes una cuenta con ese correo. Inicia sesión.");
      setPassword("");
      setPassword2("");
      window.location.reload();
      return;
    }

    setEntrando(true);
    try {
      const token = await entrarConUsuario(alta.username || dominioLimpio);
      setPassword("");
      setPassword2("");
      if (token) await aceptar(token);
    } finally {
      setEntrando(false);
    }
  };

  const guardar = async (data: any, siguiente: Paso) => {
    try {
      const res = await updateMutation.mutateAsync({
        record_id: recordId,
        account_id: accountId,
        data,
        jwt,
      });
      if (res) setPaso(siguiente);
    } catch {
      // el toast ya lo muestra onError del hook
    }
  };

  const perfilCompleto =
    !!razonSocial.trim() && !!rfc.trim() && !!telefono.trim() && servicios.length > 0;
  const documentosCompletos =
    altaFiscal.length > 0 && identificacion.length > 0 && comprobante.length > 0;

  // ============================================
  // Estados de carga / liga invalida
  // ============================================

  if (!paramsListos) {
    return (
      <div className="flex justify-center items-center mt-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!recordId || !accountId) {
    return (
      <Contenedor>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enlace incompleto</CardTitle>
          <CardDescription>
            Este enlace no trae la información de la invitación. Abre la liga tal
            como llegó en tu correo, sin recortarla.
          </CardDescription>
        </CardHeader>
      </Contenedor>
    );
  }

  // ============================================
  // Paso 1 — Identidad
  // ============================================

  if (paso === "identidad") {
    const yaAcepto = invitacion?.ya_aceptada && mismaCuenta;
    const puedeContinuarConSesion = isAuth && !!jwt && (mismaCuenta || yaAcepto);

    return (
      <Contenedor>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {invitacion?.razon_social
              ? `Invitación de ${invitacion.razon_social}`
              : "Invitación de contratista"}
          </CardTitle>
          <CardDescription>
            Te invitaron a registrarte como contratista. Identifícate con tu
            cuenta de clave10 para aceptar la invitación.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>
              <span className="text-red-500">*</span> Correo de la invitación
            </Label>
            <Input
              type="email"
              value={email}
              readOnly={!!emailParam}
              placeholder="tucorreo@empresa.com"
              onChange={(ev) => {
                setEmail(ev.target.value.trim().toLowerCase());
                setCheckActivo(false);
              }}
            />
            {!!emailParam && (
              <p className="text-xs text-slate-500">
                Este es el correo al que se envió la invitación.
              </p>
            )}
          </div>

          {!checkActivo && (
            <Button
              className="w-full"
              disabled={!email}
              onClick={() => setCheckActivo(true)}>
              Continuar
            </Button>
          )}

          {checkActivo && isLoadingInvitacion && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {checkActivo && !!errorInvitacion && (
            <p className="text-sm text-red-600 text-center">
              {(errorInvitacion as Error).message}
            </p>
          )}

          {invitacion?.invitacion_valida && (
            <>
              {puedeContinuarConSesion ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-md p-3">
                    <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      Continuarás como{" "}
                      <strong>{userNameSoter || userEmailSoter}</strong>
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    disabled={isLoadingAceptar}
                    onClick={() => aceptar(jwt)}>
                    {isLoadingAceptar && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Aceptar invitación
                  </Button>
                </div>
              ) : invitacion.user_exists ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>
                      <span className="text-red-500">*</span> Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={verPassword ? "text" : "password"}
                        value={password}
                        placeholder="Tu contraseña"
                        className="pr-10"
                        onChange={(ev) => setPassword(ev.target.value)}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") iniciarSesion();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!password || entrando || isLoadingAceptar}
                    onClick={iniciarSesion}>
                    {(entrando || isLoadingAceptar) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Iniciar sesión y aceptar
                  </Button>
                </div>
              ) : (
                // FASE 2: cuando la plataforma exponga el alta de cuenta
                // independiente, este bloque se reemplaza por el formulario de
                // registro in-page (ver crear_cuenta_contratista en el
                // servicio, que hoy responde 501 a proposito).
                <div className="space-y-4">
                  <div className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                    No encontramos una cuenta de clave10 con ese correo. Créala
                    aquí para aceptar la invitación.
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <span className="text-red-500">*</span> Dominio de tu empresa
                    </Label>
                    <div className="flex items-stretch">
                      <Input
                        value={dominio}
                        autoComplete="username"
                        placeholder="vitro"
                        className="rounded-r-none border-r-0"
                        onChange={(ev) =>
                          setDominio(normalizarDominio(ev.target.value))
                        }
                      />
                      <span className="inline-flex items-center whitespace-nowrap rounded-r-md border border-l-0 border-input bg-slate-50 px-3 text-sm text-slate-500">
                        .clave10.com
                      </span>
                    </div>
                    <DominioEstado
                      dominio={dominio}
                      formatoValido={formatoDominioOk}
                      ocupados={ocupados}
                      sugerencias={sugerencias}
                      onElegir={setDominio}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>
                        <span className="text-red-500">*</span> Nombre(s)
                      </Label>
                      <Input
                        value={nombre}
                        onChange={(ev) => setNombre(ev.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellidos</Label>
                      <Input
                        value={apellidos}
                        onChange={(ev) => setApellidos(ev.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <PhoneInput
                      defaultCountry={"MX" as CountryCode}
                      international
                      value={telefono}
                      onChange={(value) => setTelefono(value || "")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <span className="text-red-500">*</span> Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={verPassword ? "text" : "password"}
                        value={password}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        className="pr-10"
                        onChange={(ev) => setPassword(ev.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <span className="text-red-500">*</span> Confirmar contraseña
                    </Label>
                    <Input
                      type={verPassword ? "text" : "password"}
                      value={password2}
                      autoComplete="new-password"
                      onChange={(ev) => setPassword2(ev.target.value)}
                    />
                    {!!password2 && password !== password2 && (
                      <p className="text-xs text-red-600">
                        Las contraseñas no coinciden
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!puedeRegistrarse || isLoadingCrearCuenta || entrando}
                    onClick={registrarse}>
                    {(isLoadingCrearCuenta || entrando) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Crea tu cuenta en Clave10
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Contenedor>
    );
  }

  // ============================================
  // Paso 2 — Perfil de la empresa
  // ============================================

  if (paso === "perfil") {
    return (
      <Contenedor>
        <Pasos actual={2} />
        <CardHeader>
          <CardTitle className="text-xl">Datos de tu empresa</CardTitle>
          <CardDescription>
            Confirma o completa la información de tu empresa.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              <span className="text-red-500">*</span> Razón social
            </Label>
            <Input
              value={razonSocial}
              onChange={(ev) => setRazonSocial(ev.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              <span className="text-red-500">*</span> RFC
            </Label>
            <Input
              value={rfc}
              onChange={(ev) => setRfc(ev.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-2">
            <Label>
              <span className="text-red-500">*</span> Teléfono
            </Label>
            <PhoneInput
              defaultCountry={"MX" as CountryCode}
              international
              value={telefono}
              onChange={(value) => setTelefono(value || "")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label>
              <span className="text-red-500">*</span> Servicios a prestar
            </Label>
            <div className="space-y-2">
              {SERVICIOS.map((s) => (
                <div key={s.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`serv-${s.value}`}
                    checked={servicios.includes(s.value)}
                    onCheckedChange={(checked) =>
                      setServicios((prev) =>
                        checked
                          ? [...prev, s.value]
                          : prev.filter((v) => v !== s.value),
                      )
                    }
                  />
                  <Label htmlFor={`serv-${s.value}`} className="font-normal">
                    {s.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={!perfilCompleto || isLoadingUpdate}
            onClick={() =>
              guardar(
                {
                  razon_social: razonSocial,
                  rfc,
                  telefono,
                  servicios,
                },
                "documentos",
              )
            }>
            {isLoadingUpdate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar y continuar
          </Button>
        </CardFooter>
      </Contenedor>
    );
  }

  // ============================================
  // Paso 3 — Documentos
  // ============================================

  if (paso === "documentos") {
    return (
      <Contenedor>
        <Pasos actual={3} />
        <CardHeader>
          <CardTitle className="text-xl">Documentos</CardTitle>
          <CardDescription>
            Sube los documentos de tu empresa. Puedes guardar y volver después.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <LoadFile
            id="alta-fiscal"
            titulo="Alta de Situación Fiscal"
            setDocs={setAltaFiscal}
            docArray={altaFiscal}
            limit={5}
          />
          <LoadFile
            id="identificacion"
            titulo="Identificación del Representante Legal"
            setDocs={setIdentificacion}
            docArray={identificacion}
            limit={5}
          />
          <LoadFile
            id="comprobante-domicilio"
            titulo="Comprobante de Domicilio"
            setDocs={setComprobante}
            docArray={comprobante}
            limit={5}
          />
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="w-1/3"
            onClick={() => setPaso("perfil")}>
            Atrás
          </Button>
          <Button
            className="w-2/3"
            disabled={!documentosCompletos || isLoadingUpdate}
            onClick={() =>
              guardar(
                {
                  alta_fiscal: altaFiscal,
                  identificacion,
                  comprobante_domicilio: comprobante,
                },
                "resumen",
              )
            }>
            {isLoadingUpdate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar y continuar
          </Button>
        </CardFooter>
      </Contenedor>
    );
  }

  // ============================================
  // Paso 4 — Resumen
  // ============================================

  if (paso === "resumen") {
    return (
      <Contenedor>
        <Pasos actual={4} />
        <CardHeader>
          <CardTitle className="text-xl">Revisa y envía</CardTitle>
          <CardDescription>
            Verifica tu información antes de enviar la solicitud.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <Dato label="Razón social" valor={razonSocial} />
          <Dato label="RFC" valor={rfc} />
          <Dato label="Teléfono" valor={telefono} />
          <Dato
            label="Servicios"
            valor={SERVICIOS.filter((s) => servicios.includes(s.value))
              .map((s) => s.label)
              .join(", ")}
          />
          <Dato label="Alta de Situación Fiscal" valor={`${altaFiscal.length} archivo(s)`} />
          <Dato
            label="Identificación Rep. Legal"
            valor={`${identificacion.length} archivo(s)`}
          />
          <Dato label="Comprobante de Domicilio" valor={`${comprobante.length} archivo(s)`} />
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="w-1/3"
            onClick={() => setPaso("documentos")}>
            Atrás
          </Button>
          <Button
            className="w-2/3"
            disabled={isLoadingUpdate}
            onClick={async () => {
              try {
                const res = await updateMutation.mutateAsync({
                  record_id: recordId,
                  account_id: accountId,
                  data: { marcar_completada: true },
                  jwt,
                });
                if (res) setPaso("enviada");
              } catch {
                // el toast ya lo muestra onError del hook
              }
            }}>
            {isLoadingUpdate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enviar solicitud
          </Button>
        </CardFooter>
      </Contenedor>
    );
  }

  // ============================================
  // Enviada
  // ============================================

  return (
    <Contenedor>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <MailCheck className="w-12 h-12 text-green-600" />
        </div>
        <CardTitle className="text-2xl">¡Solicitud enviada!</CardTitle>
        <CardDescription>
          Tu información quedó registrada. Te avisaremos por correo cuando sea
          revisada.
        </CardDescription>
      </CardHeader>
    </Contenedor>
  );
}

// ============================================
// Presentacion
// ============================================

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center items-start px-4 mt-10 mb-16">
      <Card className="w-full max-w-lg p-2">{children}</Card>
    </div>
  );
}

function Pasos({ actual }: { actual: number }) {
  return (
    <div className="flex justify-center gap-2 pt-4">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={`h-2 rounded-full transition-all ${
            n === actual
              ? "w-8 bg-blue-600"
              : n < actual
                ? "w-2 bg-blue-300"
                : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Normaliza mientras se teclea, en vez de rechazar despues.
 *
 * El error tipico es escribir el dominio como nombre de usuario
 * ("juan.perez", "mi_empresa"): punto, espacio y guion bajo se convierten en
 * guion en lugar de desaparecer, asi el contratista ve a donde va su texto.
 * Todo lo demas que no sea [a-z0-9-] si se descarta. El guion inicial no se
 * puede quitar aqui -- se necesita poder teclear "a-b" -- de eso se encarga la
 * validacion de formato.
 */
function normalizarDominio(valor: string) {
  return (
    valor
      .toLowerCase()
      .trim()
      // Pegar la direccion completa es lo natural cuando el sufijo se ve al
      // lado del input. Se quita ANTES de tocar los puntos, si no queda
      // "vitro-clave10-com".
      .replace(/\.?clave10\.com\.?$/, "")
      // Pliega acentos en vez de borrarlos: 'ñoño' -> 'nono', no 'oo'.
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s._]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-{2,}/g, "-")
      .slice(0, 30)
  );
}

/**
 * Estado del dominio debajo del input.
 *
 * No dice "disponible": no se consulta nada antes de crear. Solo reacciona a
 * lo que el alta respondio, que es la unica fuente de verdad.
 */
function DominioEstado({
  dominio,
  formatoValido,
  ocupados,
  sugerencias,
  onElegir,
}: {
  dominio: string;
  formatoValido: boolean;
  ocupados: string[];
  sugerencias: string[];
  onElegir: (valor: string) => void;
}) {
  const limpio = dominio.trim().toLowerCase();
  const ultimoOcupado = ocupados[ocupados.length - 1];

  if (!limpio) {
    return (
      <p className="text-xs text-slate-500">
        Es la dirección con la que vas a entrar:{" "}
        <strong>vitro.clave10.com</strong>. Lo más práctico es usar el dominio
        de tu correo de empresa: si escribes desde{" "}
        <em>compras@vitro.com</em>, tu dominio es <strong>vitro</strong>.
      </p>
    );
  }
  if (!formatoValido) {
    return (
      <p className="text-xs text-red-600">
        De 3 a 30 caracteres: letras, números y guiones. No puede empezar ni
        terminar con guion.
      </p>
    );
  }
  if (!ultimoOcupado) {
    return (
      <p className="text-xs text-slate-500">
        Vas a entrar en <strong>{limpio}.clave10.com</strong>. Lo confirmamos al
        crear tu cuenta.
      </p>
    );
  }
  const chocaAhora = ocupados.includes(limpio);
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-red-600">
        <strong>{(chocaAhora ? limpio : ultimoOcupado) + ".clave10.com"}</strong>{" "}
        ya está ocupado.
        {!chocaAhora && " Elegimos otro por ti; puedes cambiarlo."}
      </p>
      {sugerencias.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Sugerencias:</span>
          {sugerencias.map((sugerencia) => (
            <button
              key={sugerencia}
              type="button"
              onClick={() => onElegir(sugerencia)}
              className={`text-xs rounded-full border px-2 py-0.5 transition-colors ${
                limpio === sugerencia
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}>
              {sugerencia}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{valor || "—"}</span>
    </div>
  );
}
