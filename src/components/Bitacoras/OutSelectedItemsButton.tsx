import React, { useState } from 'react'
import { Button } from '../ui/button'
import { DoorOpen } from 'lucide-react'
import OutSelectedItemsModal from './OutSelectedItemsModal'

const OutSelectedItemsButton = ({ selectedItems }: { selectedItems: { record_id: string; record_status?: string }[] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const allAreSalida = selectedItems.length > 0 && selectedItems.every(item => item.record_status?.toLowerCase() === "salida");

    const handleConfirm = () => {
        console.log("Procesando salida para IDs:", selectedItems.map(i => i.record_id));
        setIsModalOpen(false);
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={allAreSalida}
            >
                <DoorOpen className="h-4 w-4 mr-2" />
                Dar salida
            </Button>

            <OutSelectedItemsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedItems={selectedItems}
                onConfirm={handleConfirm}
            />
        </>
    )
}

export default OutSelectedItemsButton