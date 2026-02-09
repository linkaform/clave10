"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from "@/lib/utils";

export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function Tooltip({ content, children, className, contentClassName }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left + rect.width / 2,
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div
            ref={triggerRef}
            className={cn("inline-block", className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {mounted && isVisible && createPortal(
                <div
                    className={cn(
                        "fixed z-[9999] -translate-x-1/2 -translate-y-full mb-2 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
                    )}
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`
                    }}
                >
                    <div className={cn(
                        "rounded-lg border bg-white p-3 shadow-xl ring-1 ring-black/5 min-w-[160px]",
                        contentClassName
                    )}>
                        {content}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-black/5 -z-10" />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
