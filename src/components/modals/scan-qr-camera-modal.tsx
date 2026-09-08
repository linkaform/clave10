"use client";

import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mismo patrón probado en producción que scan-pass-with-camera.tsx (Accesos),
// pero genérico (onScan) en vez de escribir directo a useAccessStore, para
// poder reusarlo fuera de ese flujo.
const CAMERA_CONTAINER_ID = "qr-reader-transportista";

interface ScanQrCameraModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export function ScanQrCameraModal({ open, onClose, onScan, title = "Escanear pase" }: ScanQrCameraModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef(false);
  const isMounted = useRef(true);
  // Evita reiniciar la cámara si `onScan` cambia de identidad entre renders —
  // el efecto solo depende de `open`.
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    isMounted.current = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (open) {
      scannerStartedRef.current = false;
      timeout = setTimeout(() => {
        if (!isMounted.current) return;
        const element = document.getElementById(CAMERA_CONTAINER_ID);
        if (!element) return;
        const html5QrCode = new Html5Qrcode(CAMERA_CONTAINER_ID);
        scannerRef.current = html5QrCode;

        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length > 0) {
              html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => { onScanRef.current(decodedText); },
                () => {},
              ).then(() => {
                scannerStartedRef.current = true;
              });
            }
          })
          .catch((err) => {
            console.log("Error getting cameras:", err);
          });
      }, 300);

      return () => {
        isMounted.current = false;
        if (timeout) clearTimeout(timeout);
        if (scannerRef.current && scannerStartedRef.current) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch((err) => {
              if (!String(err).includes("scanner is not running")) {
                console.error("Error stopping scanner:", err);
              }
            });
        } else if (scannerRef.current) {
          scannerRef.current.clear();
        }
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-center font-bold my-3">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            Muestra el código QR del pase a escanear.
          </DialogDescription>
        </DialogHeader>
        <div
          id={CAMERA_CONTAINER_ID}
          style={{ width: "100%", maxWidth: "400px", height: "300px", margin: "20px auto" }}
        />
      </DialogContent>
    </Dialog>
  );
}
