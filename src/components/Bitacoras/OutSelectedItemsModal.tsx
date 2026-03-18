import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface OutSelectedItemsModalProps {
    isOpen: boolean
    onClose: () => void
    selectedItems: { record_id: string; record_status?: string }[]
    onConfirm: () => void
}

const OutSelectedItemsModal = ({ isOpen, onClose, selectedItems, onConfirm }: OutSelectedItemsModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] p-8 !text-center">
                <div className="flex flex-col items-center justify-center w-full gap-6">
                    <DialogHeader className="w-full flex flex-col items-center justify-center !text-center gap-3">
                        <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-900 leading-tight w-full text-center">
                            ¿Confirmar salida para <span className="text-blue-600 font-bold">{selectedItems.length}</span> registros?
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-[0.9rem] max-w-[320px] text-center">
                            Esta acción registrará la salida oficial de los elementos seleccionados en el sistema.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center">
                        <p className="text-[0.75rem] text-slate-500 leading-relaxed italic text-center">
                            Nota: Solo se procesarán aquellos registros que <span className="font-medium text-slate-700 not-italic">no tengan</span> una salida previa.
                        </p>
                    </div>

                    <DialogFooter className="w-full flex sm:flex-row flex-col justify-center items-center gap-3 mt-2">
                        <Button 
                            variant="ghost" 
                            onClick={onClose} 
                            className="w-full sm:flex-1 h-11 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={onConfirm}
                            className="w-full sm:flex-[1.5] h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                            Confirmar Salida
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default OutSelectedItemsModal
