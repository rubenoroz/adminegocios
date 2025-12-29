"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

interface ModernKpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    positive?: boolean;
    gradientClass: string;
    subtitle?: string;
    sparklineData?: number[];
    variant?: "gradient" | "neutral";
}

export function ModernKpiCard({
    title,
    value,
    icon: Icon,
    trend,
    positive = true,
    gradientClass,
    subtitle,
    sparklineData,
    variant = "gradient"
}: ModernKpiCardProps) {
    const isNeutral = variant === "neutral";

    return (
        <motion.div
            className={`kpi-card-modern ${isNeutral ? "bg-white border border-slate-200" : gradientClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
            }}
            style={isNeutral ? { boxShadow: "var(--shadow-md)" } : {}}
        >
            {/* Icon */}
            <motion.div
                className="kpi-icon-gradient"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
                style={isNeutral ? {
                    background: "var(--surface)",
                    color: "var(--primary-600)"
                } : {}}
            >
                <Icon size={32} />
            </motion.div>

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
                <h3 style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    opacity: 0.9,
                    marginBottom: "8px",
                    color: isNeutral ? "var(--muted-text)" : "white"
                }}>
                    {title}
                </h3>

                <motion.div
                    className="kpi-value-large"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={isNeutral ? { color: "var(--text)" } : { color: "white" }}
                >
                    {value}
                </motion.div>

                {subtitle && (
                    <p style={{
                        fontSize: "12px",
                        opacity: 0.8,
                        marginTop: "4px",
                        color: isNeutral ? "var(--muted-text)" : "white"
                    }}>
                        {subtitle}
                    </p>
                )}

                {/* Trend Indicator */}
                {typeof trend !== 'undefined' && (
                    <motion.div
                        className="kpi-trend-indicator"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            marginTop: "12px",
                            background: positive
                                ? (isNeutral ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.2)")
                                : (isNeutral ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.2)"),
                            color: positive
                                ? (isNeutral ? "#059669" : "white")
                                : (isNeutral ? "#dc2626" : "white")
                        }}
                    >
                        {positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        <span>{Math.abs(trend)}%</span>
                        <span style={{ fontSize: "12px", opacity: 0.8 }}>
                            vs. mes anterior
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Mini Sparkline */}
            {sparklineData && sparklineData.length > 0 && (
                <div style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    width: "100px",
                    height: "40px",
                    opacity: isNeutral ? 0.3 : 0.5,
                    color: isNeutral ? "var(--primary-500)" : "currentColor"
                }}>
                    <MiniSparkline data={sparklineData} />
                </div>
            )}
        </motion.div>
    );
}

// Mini Sparkline Component
function MiniSparkline({ data }: { data: number[] }) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
        </svg>
    );
}
