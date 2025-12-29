"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    gradient?: string;
    trend?: {
        value: number;
        label?: string;
    };
    color?: string;
}

export function StatsCard({
    label,
    value,
    icon,
    gradient = "from-primary-600 to-purple-600",
    trend,
    color = "primary"
}: StatsCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp size={16} className="text-white" />;
        if (trend.value < 0) return <TrendingDown size={16} className="text-white" />;
        return <Minus size={16} className="text-white/70" />;
    };

    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative p-6 rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300`}
        >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    {/* Icon with glassmorphism */}
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                        {icon}
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
                            {getTrendIcon()}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                <div className="text-sm text-white/80 mb-1 font-medium">{label}</div>
                <div className="text-4xl font-bold text-white mb-2">{value}</div>

                {trend?.label && (
                    <div className="text-xs text-white/70">{trend.label}</div>
                )}
            </div>
        </motion.div>
    );
}
