import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import { ScanPassWithCameraModal } from './scan-pass-with-camera'
import { Button } from '../ui/button'
import { ScanLine, Webcam } from 'lucide-react'

const STORAGE_KEY = 'scan_preference'

interface ScanPassOptionsModalProps {
    title: string
    children: React.ReactNode
    inputRef: React.RefObject<HTMLInputElement>
    preference: 'camera' | 'scanner' | null
    setPreference: (val: 'camera' | 'scanner' | null) => void
}

export const ScanPassOptionsModal: React.FC<ScanPassOptionsModalProps> = ({
    title,
    children,
    inputRef,
    preference,
    setPreference,
}) => {
    const [open, setOpen] = useState(false);
    const [openCamera, setOpenCamera] = useState(false);

    const handleScannerClick = () => {
        localStorage.setItem(STORAGE_KEY, 'scanner');
        setPreference('scanner');
        setOpen(false);
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const handleOpenCamera = () => {
        localStorage.setItem(STORAGE_KEY, 'camera');
        setPreference('camera');
        setOpenCamera(true);
    };

    const handleCloseCamera = (value: boolean) => {
        setOpenCamera(value);
        if (!value) setOpen(false);
    };

    const handleTriggerClick = () => {
        if (preference === 'camera') {
            setOpenCamera(true);
        } else if (preference === 'scanner') {
            setTimeout(() => inputRef.current?.focus(), 200);
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <div onClick={handleTriggerClick}>
                {children}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='max-w-xl' aria-describedby='scan-description'>
                    <DialogHeader>
                        <DialogTitle className='text-2xl text-center font-bold my-5'>
                            {title}
                        </DialogTitle>
                        <DialogDescription id='scan-description' className='text-center'>
                            Escoge el dispositivo para empezar escanear tu pase.
                        </DialogDescription>
                    </DialogHeader>
                    <div className='flex items-center justify-center gap-4 mb-8 mt-2'>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleOpenCamera}
                        >
                            <Webcam />
                            Utilizar Cámara
                        </Button>
                        <Button
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            onClick={handleScannerClick}
                        >
                            <ScanLine />
                            Utilizar Scanner
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ScanPassWithCameraModal
                title="Escanea un pase con la camara"
                open={openCamera}
                setOpen={handleCloseCamera}
            />
        </>
    )
}