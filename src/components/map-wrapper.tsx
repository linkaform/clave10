"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-v2"), {
  ssr: false,
  loading: () => <div style={{ height: 180 }}>Cargando mapa...</div>,
});

export default MapView;