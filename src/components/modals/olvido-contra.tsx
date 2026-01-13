"use client";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Dispatch, SetStateAction, useState } from "react";
import { Input } from "../ui/input";

interface OlvidoContraModalProps {
    title: string;
    username: string;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const OlvidoContraModal: React.FC<OlvidoContraModalProps> = ({
    title,
    username,
    open,
    setOpen,
}) => {
    // const { sendResetEmailMutation, isLoading } = useSendResetEmail();
    const [localName, setLocalName] = useState(username || "");

    return (
        <Dialog open={open} onOpenChange={setOpen} modal>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center  font-bold ">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <Input
                        placeholder="Nombre del usuario"
                        className="resize-none"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                    />

                    <div className="flex gap-5 mt-5">
                        <DialogClose asChild>
                            <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700">
                                Cancelar
                            </Button>
                        </DialogClose>

                        <Button
                            className="w-full  bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => {
                                    // sendResetEmailMutation.mutate({ username: localName }, {
                                    //     onSuccess: () => {
                                    //         setOpen(false);
                                    //         setNombreSuplente(localName)
                                    //     }
                                    // })
                            }}
                            // disabled={localName.trim() === "" || isLoading}
                        >
                            {/* {isLoading ? "Cargando..." : "Confirmar"} */}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};