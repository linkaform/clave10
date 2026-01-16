"use client";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Mail } from "lucide-react";
import { useResetPassEmail } from "@/hooks/Login/useResetPassEmail";

interface OlvidoContraModalProps {
    title: string;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const OlvidoContraModal: React.FC<OlvidoContraModalProps> = ({
    title,
    open,
    setOpen,
}) => {
    const {  resetPassEmailMutation, isLoading } = useResetPassEmail();
    const [localName, setLocalName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
          setError("");
          setLocalName("");
        }
      }, [open]);
      
    return (
        <Dialog open={open} onOpenChange={setOpen} modal>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center font-bold ">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="text-center text-gray-500 text-sm">
                Ingresa tu <span className="font-bold">nombre de usuario</span> para enviarte las instrucciones de recuperación de contraseña.
                Si el usuario existe en el sistema, recibirás un correo electrónico con los pasos para restablecer tu acceso.
                </div>

                <div className="p-4">
                    <div className="text-sm text-gray-500 mb-2">Nombre de usuario:</div>
                    <Input
                        placeholder="Nombre de usuario"
                        value={localName}
                        onChange={(e) => {
                            setLocalName(e.target.value);
                            if (error) setError("");
                        }}
                        />

                    {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}

                    <div className="flex gap-5 mt-5">
                        <DialogClose asChild>
                            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                                Cancelar
                            </Button>
                        </DialogClose>

                        <Button
                            className="w-full  bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => {
                                if (!localName.trim()) {
                                    setError("El nombre de usuario es obligatorio");
                                    return;
                                }
                                resetPassEmailMutation.mutate({ username: localName }, {
                                        onSuccess: () => {
                                            setOpen(false);
                                            setLocalName("");
                                        }
                                    })
                            }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Cargando..." :<> <Mail /> Enviar correo </>}
                            
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};