import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import AttendanceDetailContent from "./AttendanceDetailContent";

interface AttendanceCarouselModalProps {
    open: boolean;
    onClose: () => void;
    names: string[];
    userIds: number[];
    selectedDay: number;
    ubicacion: string;
    daysInMonth: number; // Needed to prevent navigating past boundaries
}

const AttendanceCarouselModal: React.FC<AttendanceCarouselModalProps> = ({
    open,
    onClose,
    names,
    userIds,
    selectedDay,
    ubicacion,
    daysInMonth
}) => {
    const [activeDay, setActiveDay] = useState(selectedDay);

    useEffect(() => {
        if (open) {
            setActiveDay(selectedDay);
        }
    }, [open, selectedDay]);

    const handlePrev = () => {
        if (activeDay > 1) {
            setActiveDay(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (activeDay < daysInMonth) {
            setActiveDay(prev => prev + 1);
        }
    };

    // Calculate previous and next days
    const prevDay = activeDay - 1;
    const nextDay = activeDay + 1;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none">
                <DialogTitle className="sr-only">Detalle de Asistencia</DialogTitle>

                <div
                    className="flex items-center justify-center w-full h-full gap-0 perspective-1000 cursor-default"
                    onClick={onClose}
                >

                    {/* Previous Day Card (Left) */}
                    <div
                        className={`
                            hidden md:flex flex-col items-center justify-center
                            w-[350px] h-[500px] 
                            transition-all duration-300 ease-in-out select-none
                            ${prevDay < 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-60 cursor-pointer scale-[0.85] hover:scale-[0.9] origin-right translate-x-12 z-10'}
                        `}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (prevDay >= 1) handlePrev();
                        }}
                    >
                        {prevDay >= 1 && (
                            <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden blur-[2px] hover:blur-[1px] transition-all">
                                <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none"></div>
                                <AttendanceDetailContent
                                    names={names}
                                    userIds={userIds}
                                    selectedDay={prevDay}
                                    ubicacion={ubicacion}
                                    className="pointer-events-none" // Disable interaction inside the preview
                                />
                            </div>
                        )}
                    </div>

                    {/* Active Day Card (Center) */}
                    <div
                        className="relative z-30 w-full max-w-[500px] h-full max-h-[750px] transition-all duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                            <AttendanceDetailContent
                                names={names}
                                userIds={userIds}
                                selectedDay={activeDay}
                                ubicacion={ubicacion}
                                onClose={onClose}
                            />
                        </div>
                    </div>

                    {/* Next Day Card (Right) */}
                    <div
                        className={`
                            hidden md:flex flex-col items-center justify-center
                            w-[350px] h-[500px] 
                            transition-all duration-300 ease-in-out select-none
                            ${nextDay > daysInMonth ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-60 cursor-pointer scale-[0.85] hover:scale-[0.9] origin-left -translate-x-12 z-10'}
                        `}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (nextDay <= daysInMonth) handleNext();
                        }}
                    >
                        {nextDay <= daysInMonth && (
                            <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden blur-[2px] hover:blur-[1px] transition-all">
                                <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none"></div>
                                <AttendanceDetailContent
                                    names={names}
                                    userIds={userIds}
                                    selectedDay={nextDay}
                                    ubicacion={ubicacion}
                                    className="pointer-events-none"
                                />
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AttendanceCarouselModal;
