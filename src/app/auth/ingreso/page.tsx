/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import LoadImage, { Imagen } from "@/components/upload-Image";
import { API_ENDPOINTS } from "@/config/api";
import { useGetLocalVehiculos } from "@/hooks/useLocalCatVehiculos";
import { catalogoColores, catalogoEstados } from "@/lib/utils";
import { DoorOpen, MapPin } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import QRious from "qrious";

interface Equipo {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  noSerie: string;
  color: string;
}

type EquipoForm = Omit<Equipo, "id">;

interface FormErrors {
  nombre?: boolean;
  empresa?: boolean;
  email?: boolean;
  motivo?: boolean;
  visita?: boolean;
  visitaEmail?: boolean;
  foto?: boolean;
  identificacion?: boolean;
}


interface EquipoCardProps {
  equipo: Equipo;
  onDelete: (id: number) => void;
}

const COLORES_CAT = [
  "Amarillo","Azul","Beige","Blanco","Cafe","Crema","Dorado","Gris",
  "Morado","Naranja","Negro","Plateado","Rojo","Rosa","Verde","Violeta","Otro",
];

const MOTIVOS = ["Motivo 1", "Motivo 2", "Motivo 3"];
const PASE_SCRIPT = "pase_de_acceso_use_api.py";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getCookieValue(name: string): string {
  return (
    document.cookie
      .split(";")
      .find((c) => c.trim().startsWith(`${name}=`))
      ?.split("=")[1] ?? ""
  );
}

function VehiculoCard({ vehiculo, index, onDelete }: { vehiculo: any; index: number; onDelete: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm">
        <div
          className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="font-semibold text-gray-700 flex items-center gap-2">
            <i className="fas fa-car text-red-500" />
            {vehiculo.tipo} - {vehiculo.marca}
          </span>
          <div className="flex items-center gap-2">
            <i className={`fas fa-chevron-down text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
            <button onClick={(e) => { e.stopPropagation(); onDelete(index); }}
              className="bg-red-300 hover:bg-red-400 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center text-xs"
              >X</button>
          </div>
        </div>
        {open && (
          <div className="p-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
            <div><strong>Tipo:</strong> {vehiculo.tipo}</div>
            <div><strong>Marca:</strong> {vehiculo.marca}</div>
            <div><strong>Modelo:</strong> {vehiculo.modelo}</div>
            <div><strong>Estado:</strong> {vehiculo.estado}</div>
            <div><strong>Placas:</strong> {vehiculo.placas}</div>
            <div><strong>Color:</strong> {vehiculo.color}</div>
          </div>
        )}
      </div>
    );
  }
function EquipoCard({ equipo, onDelete }: EquipoCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm">
      <div
        className="flex justify-between items-center p-3 bg-gray-50 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-gray-700 flex items-center gap-2">
          <i className="fas fa-toolbox text-red-500" />
          {equipo.tipo} - {equipo.marca}
        </span>
        <div className="flex items-center gap-2">
          <i
            className={`fas fa-chevron-down text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(equipo.id);
            }}
            className="bg-red-300 hover:bg-red-400 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center text-xs"
          >
            X
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
          <div><strong>Tipo:</strong> {equipo.tipo}</div>
          <div><strong>Marca:</strong> {equipo.marca}</div>
          <div><strong>Modelo:</strong> {equipo.modelo}</div>
          <div><strong>No. Serie:</strong> {equipo.noSerie}</div>
          <div><strong>Color:</strong> {equipo.color}</div>
        </div>
      )}
    </div>
  );
}

export default function RegistroIngresoPage() {
  const [ubicacion, setUbicacion] = useState("");
  const [caseta, setCaseta] = useState("");
  const [accountId, setAccountId] = useState<string | number>(10);
  const [fotografiaRequerida, setFotografiaRequerida] = useState(false);
  const [identificacionRequerida, setIdentificacionRequerida] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivoSelect, setMotivoSelect] = useState("");
  const [motivoOtro, setMotivoOtro] = useState("");

  const [visitaNombre, setVisitaNombre] = useState("");
  const [visitaEmail, setVisitaEmail] = useState("");
  const [visitaTelefono, setVisitaTelefono] = useState("");

  const [showFormVehiculo, setShowFormVehiculo] = useState(false);
  const [ tipoVehiculoState,setTipoVehiculoState] = useState("");
  const [ marcaState,setMarcaState] = useState("");
  const [vehiculo, setVehiculo] = useState({
    tipo: "", marca: "", modelo: "", estado: "", placas: "", color: ""
  });  
  const [tiposCat, setTiposCat] = useState<{ value: string; label: string }[] | null>(null);
  const [marcasCat, setMarcasCat] = useState<{ value: string; label: string }[]>([]);
  const [modelosCat, setModelosCat] = useState<{ value: string; label: string }[]>([]);
  const [vehiculos, setVehiculos] = useState<typeof vehiculo[]>([]);
  const {data:dataVehiculos } = useGetLocalVehiculos({ tipo:tipoVehiculoState, marca:marcaState, isModalOpen:true})

  const [catalogSearch, setCatalogSearch] = useState("");
  const [imgUserArray, setImgUserArray] = useState< Imagen []>([]);
  const [imgCardArray, setImgCardArray] = useState< Imagen []>([]);

  // const [fotosVisita, setFotosVisita] = useState<FotosVisita>({
  //   foto: [],
  //   identificacion: [],
  // });
  const catEstados = catalogoEstados().map((tipo: any) => ({
    value: tipo,
    label: tipo
  }));
  const catColores = catalogoColores().map((tipo: any) => ({
    value: tipo,
    label: tipo
  }));

  useEffect(() => {
    if (!tiposCat && dataVehiculos) {
      const opcionesTipos = [...new Set(dataVehiculos)].map((tipo: any) => ({
        value: tipo,
        label: tipo,
      }));
      setTiposCat(opcionesTipos);
    }
    if (dataVehiculos && tipoVehiculoState && catalogSearch === "marcas") {
      const opcionesMarcas = [...new Set(dataVehiculos)].map((marca: any) => ({
        value: marca,
        label: marca,
      }));
      setMarcasCat(opcionesMarcas);
    }
    if (dataVehiculos && tipoVehiculoState && marcaState && catalogSearch === "modelos") {
      const opcionesModelos = [...new Set(dataVehiculos)].map((modelo: any) => ({
        value: modelo,
        label: modelo,
      }));
      setModelosCat(opcionesModelos);
    }
  }, [catalogSearch, dataVehiculos, marcaState, tipoVehiculoState, tiposCat]);

  useEffect(() => {
    setTiposCat(dataVehiculos)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [equiposAgregados, setEquiposAgregados] = useState<Equipo[]>([]);
  const [showFormEquipo, setShowFormEquipo] = useState(false);
  const [equipo, setEquipo] = useState<EquipoForm>({
    tipo: "",
    marca: "",
    modelo: "",
    noSerie: "",
    color: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ub = (params.get("ubicacion") ?? "").replace(/"/g, "");
    const ca = (params.get("caseta") ?? "").replace(/"/g, "");
    const acc = params.get("acc_id") ?? 10;
    setUbicacion(ub);
    setCaseta(ca);
    setAccountId(acc);
    if (ub) cargarConfiguracion(ub, acc);
  }, []);

  async function cargarConfiguracion(ub: string, acc: string | number) {
    setLoadingConfig(true);
    try {
      const res = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [ub],
          option: "get_config_modulo_seguridad",
          script_name: PASE_SCRIPT,
          account_id: acc,
        }),
      });
  
      const text = await res.text();
      console.log("Respuesta raw:", text);
  
      try {
        const data = JSON.parse(text);
        if (data.success) {
          const reqs: string[] = data.response.data.requerimientos || [];
          setFotografiaRequerida(reqs.includes("fotografia"));
          setIdentificacionRequerida(reqs.includes("identificacion"));
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error("No es JSON válido:", text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfig(false);
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!nombre.trim()) errs.nombre = true;
    if (!empresa.trim()) errs.empresa = true;

    const motivo =
      motivoSelect === "otro" ? motivoOtro.trim() : motivoSelect;
    if (!motivo) errs.motivo = true;

    if (email && !isValidEmail(email)) errs.email = true;
    if (visitaEmail && !isValidEmail(visitaEmail)) errs.visitaEmail = true;
    if (!visitaNombre && !visitaEmail && !visitaTelefono) errs.visita = true;
    if (fotografiaRequerida && !imgUserArray) errs.foto = true;
    if (identificacionRequerida && !imgCardArray) errs.identificacion = true;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor completa los campos obligatorios correctamente.",
        confirmButtonColor: "#d32f2f",
      });
      return;
    }
    const motivo = motivoSelect === "otro" ? motivoOtro.trim() : motivoSelect;
    const equiposClean = equiposAgregados
    const vehiculosClean = vehiculos
    
    const equiposHTML =
      equiposClean.length > 0
        ? equiposClean.map((eq) => `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;font-size:.88em;">
              <strong>${eq.tipo} - ${eq.marca}</strong><br/>
              Modelo: ${eq.modelo} | Serie: ${eq.noSerie} | Color: ${eq.color}
            </div>`).join("")
        : `<div style="text-align:center;color:#6c757d;font-size:.9em;padding:8px;">No se agregaron equipos</div>`;
    
    const vehiculosHTML =
      vehiculosClean.length > 0
        ? vehiculosClean.map((v) => `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-bottom:8px;font-size:.88em;">
              <strong>${v.tipo} - ${v.marca}</strong><br/>
              Modelo: ${v.modelo} | Estado: ${v.estado} | Placas: ${v.placas} | Color: ${v.color}
            </div>`).join("")
        : `<div style="text-align:center;color:#6c757d;font-size:.9em;padding:8px;">No se agregaron vehículos</div>`;
    
    const result = await Swal.fire({
      title: `<div style="font-size:.85em;font-weight:700;color:#2c3e50;">Confirmar registro</div>`,
      html: `
        <div style="max-height:60vh;overflow-y:auto;font-size:.92em;color:#2c3e50;text-align:left;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;background:#f9fafb;border-radius:10px;padding:14px;border:1px solid #eceff1;">
            <div><strong>Ubicación</strong><br/><span style="color:#6c757d">${ubicacion}</span></div>
            <div><strong>Caseta</strong><br/><span style="color:#6c757d">${caseta}</span></div>
            <div><strong>Nombre</strong><br/><span style="color:#6c757d">${nombre}</span></div>
            <div><strong>Empresa</strong><br/><span style="color:#6c757d">${empresa}</span></div>
            <div><strong>Email</strong><br/><span style="color:#6c757d">${email || "-"}</span></div>
            <div><strong>Teléfono</strong><br/><span style="color:#6c757d">${telefono || "-"}</span></div>
            <div><strong>Visita a</strong><br/><span style="color:#6c757d">${visitaNombre || "-"} / ${visitaTelefono || "-"} / ${visitaEmail || "-"}</span></div>
            <div><strong>Motivo</strong><br/><span style="color:#6c757d">${motivo}</span></div>
          </div>
    
          <hr style="border:0;height:1px;background:linear-gradient(to right,transparent,#1e2d5a,transparent);margin:16px 0;">
          <strong>Documentos</strong>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
            ${imgUserArray
              ? `<div style="text-align:center;">
                   <img src="${imgUserArray[0]?.file_url}" style="width:190px;height:180px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;">
                 </div>`
              : `<div style="background:#f3f4f6;border-radius:8px;height:80px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.8em;">Sin foto</div>`
            }
            ${imgCardArray
              ? `<div style="text-align:center;">
                   <img src="${imgCardArray[0]?.file_url}" style="width:190px;height:180px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;">
                 </div>`
              : `<div style="background:#f3f4f6;border-radius:8px;height:80px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:.8em;">Sin ID</div>`
            }
          </div>
    
          <hr style="border:0;height:1px;background:linear-gradient(to right,transparent,#1e2d5a,transparent);margin:16px 0;">
          <strong>Equipos (${equiposClean.length})</strong>
          <div style="margin-top:8px;">${equiposHTML}</div>
    
          <hr style="border:0;height:1px;background:linear-gradient(to right,transparent,#1e2d5a,transparent);margin:16px 0;">
          <strong>Vehículos (${vehiculosClean.length})</strong>
          <div style="margin-top:8px;">${vehiculosHTML}</div>
        </div>
      `,
      imageUrl: "https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png",
      showConfirmButton: true,
      showCancelButton: true,
      imageWidth: 160,
      imageHeight: 60,
      confirmButtonText: "Crear pase",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#b0b3b8",
      allowOutsideClick: false,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Creando pase...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const perfil = caseta === "Lobby" ? "Internos" : "Walkin";
    const access_pass = {
      ubicaciones: [ubicacion],
      nombre,
      perfil_pase: perfil,
      telefono,
      visita_a: {
        nombre: visitaNombre,
        email: visitaEmail,
        telefono: visitaTelefono,
      },
      email,
      empresa,
      foto: imgUserArray,
      identificacion: imgCardArray,
      equipos: equiposClean,
      vehiculos:vehiculos,
      motivo,
      created_from: "auto_registro",
    };

    try {
      const userJwt = getCookieValue("userJwt_soter");
      const res = await fetch(API_ENDPOINTS.runScript, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
          script_name: PASE_SCRIPT,
          option: "create_access_pass",
          access_pass,
          account_id: accountId,
        }),
      });
      const data = await res.json();
      const statusCode = data?.response?.data?.status_code;

      if (!data.success || (statusCode && statusCode >= 400)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al crear el pase",
          confirmButtonColor: "#d32f2f",
        });
        return;
      }

      const qrCode: string = data?.response?.data?.json?.id;
      Swal.close();

      const qrResult = await Swal.fire({
        imageUrl:
          "https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png",
        imageHeight: 70,
        showConfirmButton: true,
        confirmButtonText: 'Descargar PDF <i class="fas fa-download ms-1"></i>',
        showCancelButton: true,
        cancelButtonText: "Aceptar",
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#efefef",
        allowOutsideClick: false,
        html: `
          <div class="text-center">
            <div style="font-weight:bold;font-size:1.05em;color:#333;margin-bottom:8px;">¡Información guardada correctamente!</div>
            <div style="color:#666;font-size:.9em;margin-bottom:12px;">${ubicacion} · ${caseta}</div>
            <img id="qr-img" alt="QR" style="margin:0 auto;">
          </div>`,
          didOpen: () => {
            new QRious({
              element: document.getElementById("qr-img"),
              value: qrCode ?? "QR no disponible",
              size: 200,
              backgroundAlpha: 0,
              foreground: "#505050",
              level: "L",
            });
          },
      });

      if (qrResult.isConfirmed) {
        Swal.fire({
          title: "Generando PDF...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });
        const userJwt2 = getCookieValue("userJwt_soter");
        const pdfRes = await fetch(API_ENDPOINTS.runScript, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJwt2}`,
          },
          body: JSON.stringify({
            script_name: PASE_SCRIPT,
            option: "get_pdf",
            qr_code: qrCode,
            account_id: accountId,
          }),
        }).then((r) => r.json());

        Swal.close();
        const downloadUrl: string | undefined =
          pdfRes?.response?.data?.data?.download_url;
        const fileName: string =
          pdfRes?.response?.data?.data?.file_name ?? "Pase_de_Acceso";

        if (downloadUrl) {
          const blob = await fetch(downloadUrl).then((r) => r.blob());
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName.split("/").pop() + ".pdf";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear el pase",
        confirmButtonColor: "#d32f2f",
      });
    }
  }
  const agregarVehiculo = () => {
    if (!vehiculo.tipo) return;
    setVehiculos((p) => [...p, vehiculo]);
    setVehiculo({ tipo: "", marca: "", modelo: "", estado: "", placas: "", color: "" });
    // Limpiar estados del catálogo para que se recarguen
    setTipoVehiculoState("");
    setMarcaState("");
    setCatalogSearch("");
    setMarcasCat([]);
    setModelosCat([]);
    setShowFormVehiculo(false);
  };

  function agregarEquipo() {
    if (
      !equipo.tipo ||
      !equipo.marca ||
      !equipo.modelo ||
      !equipo.noSerie ||
      !equipo.color
    ) {
      alert("Por favor completa todos los campos del equipo.");
      return;
    }
    setEquiposAgregados((prev) => [...prev, { ...equipo, id: Date.now() }]);
    setEquipo({ tipo: "", marca: "", modelo: "", noSerie: "", color: "" });
    setShowFormEquipo(false);
  }

  return (
    <div className="h-screen bg-gray-100">
      <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between">
        <Image
          src="https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png"
          height={100}
          alt="Logo Clave10"
          width={100}
        />
        <h2 className="text-xl font-bold text-gray-800">Registro de Ingreso</h2>
        <div style={{ width: 60 }} />
      </nav>

      <div className="container mx-auto  max-w-3xl px-4 pt-24">
        <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-evenly items-center bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
  
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8" style={{ color: "var(--color-brand)" }}  />
              <div>
                <div className="text-xs text-gray-500">Ubicación</div>
                <div className="font-semibold text-gray-800">{ubicacion || "-"}</div>
              </div>
            </div>

            <div className="w-px h-10 bg-blue-200" />

            <div className="flex items-center gap-3">
              <DoorOpen className="w-8 h-8" style={{ color: "var(--color-brand)" }} />
              <div>
                <div className="text-xs text-gray-500">Caseta</div>
                <div className="font-semibold text-gray-800">{caseta || "-"}</div>
              </div>
            </div>

          </div>

          <h5 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6">
            Información Personal
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Nombre Completo *
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.nombre ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.nombre && (
                <p className="text-red-500 text-xs mt-1">Campo requerido</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Empresa *
              </label>
              <input
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Nombre de la empresa"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.empresa ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.empresa && (
                <p className="text-red-500 text-xs mt-1">Campo requerido</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">Correo inválido</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="10 dígitos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {loadingConfig ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500">Cargando configuración...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-6">
              {fotografiaRequerida && (
                <div className="flex gap-1">
                  <span className="text-red-500 mt-1">*</span>
                  <div className="w-full">
                  <LoadImage
                        id="fotografia"
                        titulo={"Fotografía"}
                        showWebcamOption={true}
                        imgArray={imgUserArray}
                        setImg={setImgUserArray}
                        facingMode="user"
                        limit={1}
                        />
                  </div>
                </div>
              )}
              {(
                <div className="flex gap-1">
                  <span className="text-red-500 mt-1">*</span>
                  <div className="w-full">
                        <LoadImage
                        id="fotografia"
                        titulo={"Fotografía"}
                        showWebcamOption={true}
                        imgArray={imgCardArray}
                        setImg={setImgCardArray}
                        facingMode="user"
                        limit={1}
                        />
                  </div>
                </div>
              )}
            </div>
          )}
          <h5 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-2 mb-6 mt-6">
            Información de Visita
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Nombre{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                value={visitaNombre}
                onChange={(e) => setVisitaNombre(e.target.value)}
                placeholder="Nombre completo"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.visita ? "border-red-400" : "border-gray-300"
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Email{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                value={visitaEmail}
                onChange={(e) => setVisitaEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.visita || errors.visitaEmail
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />
              {errors.visitaEmail && (
                <p className="text-red-500 text-xs mt-1">Correo inválido</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Teléfono{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="tel"
                value={visitaTelefono}
                onChange={(e) => setVisitaTelefono(e.target.value)}
                placeholder="10 dígitos"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.visita ? "border-red-400" : "border-gray-300"
                }`}
              />
            </div>
          </div>

          {errors.visita && (
            <p className="text-red-500 text-sm mt-1 mb-3">
              Debes llenar al menos uno: Nombre, Email o Teléfono.
            </p>
          )}

          <div className="mt-4">
            <label className="block font-semibold text-gray-700 mb-1 text-sm">
              Motivo de la visita *
            </label>
            <select
              value={motivoSelect}
              onChange={(e) => setMotivoSelect(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                errors.motivo ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="" disabled>
                Selecciona un motivo
              </option>
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="otro">Otro</option>
            </select>
            {errors.motivo && (
              <p className="text-red-500 text-xs mt-1">Campo requerido</p>
            )}
          </div>

          {motivoSelect === "otro" && (
            <div className="mt-3">
              <label className="block font-semibold text-gray-700 mb-1 text-sm">
                Especifica el motivo
              </label>
              <input
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
                placeholder="Escribe el motivo"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  errors.motivo ? "border-red-400" : "border-gray-300"
                }`}
              />
            </div>
          )}


        <div className="flex justify-between items-center mt-8 mb-2">
          <h5 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-2">
            Vehículos{" "}
            <span className="text-gray-400 font-normal text-sm">(Opcional)</span>
          </h5>
          <button
            type="button"
            onClick={() => setShowFormVehiculo(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1"
          >
            <i className="fas fa-plus" /> Agregar Vehículo
          </button>
        </div>

        {showFormVehiculo && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4 mt-3">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-car text-red-500" /> Detalles del Vehículo
              </h6>
              <button
                type="button"
                onClick={() => setShowFormVehiculo(false)}
                className="bg-red-300 hover:bg-red-400 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center text-sm"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Tipo de Vehículo *
                </label>
                <select
                  value={vehiculo.tipo}
                  onChange={(e) => {
                    setVehiculo((p) => ({ ...p, tipo: e.target.value, marca: "", modelo: "" }));
                    setTipoVehiculoState(e.target.value);
                    setCatalogSearch("marcas");
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccione...</option>
                  {tiposCat?.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Marca
                </label>
                <select
                  value={vehiculo.marca}
                  onChange={(e) => {
                    setVehiculo((p) => ({ ...p, marca: e.target.value, modelo: "" }));
                    setMarcaState(e.target.value);
                    setCatalogSearch("modelos");
                  }}
                  disabled={!vehiculo.tipo}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione...</option>
                  {marcasCat?.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Modelo
                </label>
                <select
                  value={vehiculo.modelo}
                  onChange={(e) => setVehiculo((p) => ({ ...p, modelo: e.target.value }))}
                  disabled={!vehiculo.marca}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione...</option>
                  {modelosCat?.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Estado
                </label>
                <select
                  value={vehiculo.estado}
                  onChange={(e) => setVehiculo((p) => ({ ...p, estado: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccione...</option>
                  {catEstados.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Placas
                </label>
                <input
                  value={vehiculo.placas}
                  onChange={(e) => setVehiculo((p) => ({ ...p, placas: e.target.value }))}
                  placeholder="Número de placas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Color
                </label>
                <select
                  value={vehiculo.color}
                  onChange={(e) => setVehiculo((p) => ({ ...p, color: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccione...</option>
                  {catColores.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() =>
                  setVehiculo({ tipo: "", marca: "", modelo: "", estado: "", placas: "", color: "" })
                }
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <i className="fas fa-rotate-left me-1" /> Limpiar
              </button>
              <button
                type="button"
                onClick={agregarVehiculo}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <i className="fas fa-check me-1" /> Guardar
              </button>
            </div>
          </div>
        )}

        <div className="mt-2">
          {vehiculos.map((v, index) => (
            <VehiculoCard
              key={index}
              vehiculo={v}
              onDelete={(id) => setVehiculos((prev) => prev.filter((_, i) => i !== id))} index={0}/>
          ))}
        </div>
        <div className="flex justify-between items-center mt-8 mb-2">
          <h5 className="text-lg font-bold text-gray-800 border-b-2 border-blue-600 pb-2">
            Equipos{" "}
            <span className="text-gray-400 font-normal text-sm">
              (Opcional)
            </span>
          </h5>
          <button
            type="button"
            onClick={() => setShowFormEquipo(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1"
          >
            <i className="fas fa-plus" /> Agregar Equipo
          </button>
        </div>

        {showFormEquipo && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4 mt-3">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-toolbox text-red-500" /> Detalles del
                Equipo
              </h6>
              <button
                type="button"
                onClick={() => setShowFormEquipo(false)}
                className="bg-red-300 hover:bg-red-400 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center text-sm"
              >
                X
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Tipo de Equipo *
                </label>
                <select
                  value={equipo.tipo}
                  onChange={(e) =>
                    setEquipo((p) => ({ ...p, tipo: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccione...</option>
                  {["Herramienta", "Cómputo", "Tablet", "Otra"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Marca
                </label>
                <input
                  value={equipo.marca}
                  onChange={(e) =>
                    setEquipo((p) => ({ ...p, marca: e.target.value }))
                  }
                  placeholder="Marca"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Modelo
                </label>
                <input
                  value={equipo.modelo}
                  onChange={(e) =>
                    setEquipo((p) => ({ ...p, modelo: e.target.value }))
                  }
                  placeholder="Modelo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  No. Serie
                </label>
                <input
                  value={equipo.noSerie}
                  onChange={(e) =>
                    setEquipo((p) => ({ ...p, noSerie: e.target.value }))
                  }
                  placeholder="Número de serie"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-sm">
                  Color
                </label>
                <select
                  value={equipo.color}
                  onChange={(e) =>
                    setEquipo((p) => ({ ...p, color: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Seleccione...</option>
                  {COLORES_CAT.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() =>
                  setEquipo({
                    tipo: "",
                    marca: "",
                    modelo: "",
                    noSerie: "",
                    color: "",
                  })
                }
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <i className="fas fa-rotate-left me-1" /> Limpiar
              </button>
              <button
                type="button"
                onClick={agregarEquipo}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <i className="fas fa-check me-1" /> Guardar
              </button>
            </div>
          </div>
        )}

        <div className="mt-2">
          {equiposAgregados.map((eq) => (
            <EquipoCard
              key={eq.id}
              equipo={eq}
              onDelete={(id) =>
                setEquiposAgregados((prev) =>
                  prev.filter((e) => e.id !== id)
                )
              }
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-10 py-3 rounded-xl shadow-lg transition hover:-translate-y-0.5 hover:shadow-blue-300"
          >
            <i className="fas fa-arrow-right me-2" />
            Continuar
          </button>
        </div>

        </div>
      </div>
    </div>
  );
}