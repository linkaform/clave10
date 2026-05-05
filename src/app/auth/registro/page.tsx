"use client";

import Image from "next/image";
import Link from "next/link";
import { User, Building2, Users, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const profileOptions = [
  { label: "Cliente", icon: User, href: "/auth/registro/cliente" },
  { label: "Contratista", icon: Building2, href: "/auth/registro/contratista" },
  { label: "Visitante", icon: Users, href: "/auth/registro/visitante" },
  { label: "Transportista", icon: Truck, href: "/auth/registro/transportista" },
];

export default function RegistroPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Card className="w-[620px] shadow-md border-0 rounded-2xl">
        <CardContent className="flex flex-col items-center px-12 py-12">
          <Image
            src="https://f001.backblazeb2.com/file/app-linkaform/public-client-126/71202/60b81349bde5588acca320e1/694ace05f1bef74262302cc9.png"
            alt="Clave 10"
            width={174}
            height={58}
            priority
          />

          <p className="mt-4 mb-8 text-base font-bold text-gray-700">Crea tu perfil</p>

          <div className="grid grid-cols-2 gap-4 w-full">
            {profileOptions.map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href}>
                <button className="w-full flex flex-col items-center justify-center gap-3 border border-gray-200 rounded-xl py-8 bg-white hover:border-[#3D8BF2] hover:bg-blue-50 transition-all cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icon size={24} className="text-gray-500 group-hover:text-[#3D8BF2] transition-colors" />
                  </div>
                  <span className="text-sm text-gray-700 font-bold">{label}</span>
                </button>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="text-[#3D8BF2] hover:underline font-semibold">
              Inicia sesión aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
