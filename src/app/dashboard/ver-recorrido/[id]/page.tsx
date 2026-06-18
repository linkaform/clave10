"use client";
import RondinDetalle from "@/components/Bitacoras/Rondines/RondinDetalle";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RondinDetalle id={id} />;
}