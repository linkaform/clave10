import React from "react";
import PageTitle from "@/components/page-title";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Settings, Users, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const ConfiguracionPage = () => {
  const settingsGroups = [
    {
      title: "Administración del Sistema",
      icon: <Settings className="w-5 h-5 text-slate-500" />,
      items: [
        { label: "Catálogos generales", enabled: false },
        { label: "Configuración de módulos", enabled: false },
        { label: "Parámetros de operación", enabled: false },
      ],
    },
    {
      title: "Control de Acceso",
      icon: <Shield className="w-5 h-5 text-green-500" />,
      items: [
        { label: "Gestión de Roles", enabled: false },
        { label: "Permisos por usuario", enabled: false },
        { label: "Auditoría de cambios", enabled: false },
      ],
    },
    {
      title: "Recursos y Ayuda",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      items: [
        { label: "Centro de ayuda", enabled: false },
        { label: "Documentación técnica", enabled: false },
        { label: "Soporte técnico", enabled: false },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <PageTitle title="Configuración" />
        <p className="text-sm text-muted-foreground">
          Administra tus ajustes personales y de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {settingsGroups.map((group, index) => (
          <Card key={index} className="border-none shadow-none bg-accent/20">
            <CardHeader className="flex flex-row items-center gap-3 pb-2 border-b border-border/40">
              {group.icon}
              <CardTitle className="text-lg font-semibold">
                {group.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
              <ul className="space-y-3">
                {group.items.map((item, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-colors",
                      item.enabled
                        ? "hover:bg-accent cursor-pointer"
                        : "opacity-60 cursor-not-allowed",
                    )}>
                    <span className="text-sm">{item.label}</span>
                    {!item.enabled && (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracionPage;
