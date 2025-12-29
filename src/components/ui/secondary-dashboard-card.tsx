"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode, useState } from "react";

interface SecondaryDashboardCardProps {
    children: ReactNode;
    className?: string;
    title: string;
    icon?: LucideIcon;
    iconColor?: string;
    headerAction?: ReactNode;
}

export function SecondaryDashboardCard({
    children,
    className = "",
    title,
    icon: Icon,
    iconColor = "text-slate-600",
    headerAction
}: SecondaryDashboardCardProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            className={`secondary-card relative overflow-hidden rounded-2xl bg-slate-50/50 backdrop-blur-sm border border-slate-200 shadow-sm ${className}`}
            onMouseMove={handleMouseMove}
            style={{
                // @ts-expect-error - Custom CSS properties
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                    {Icon && (
                        <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-slate-100 ${iconColor}`}>
                            <Icon size={18} />
                        </div>
                    )}
                    {title}
                </h3>
                {headerAction && <div>{headerAction}</div>}
            </div>

            {/* Content */}
            <div className="p-6">
                {children}
            </div>

            {/* Hover Glow Effect */}
            <div
                className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.4), transparent 40%)`
                }}
            />
        </motion.div>
    );
}
