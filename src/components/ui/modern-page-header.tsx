"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ModernPageHeaderProps {
    title: string;
    description?: string;
    gradient?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    stats?: {
        label: string;
        value: string | number;
        color?: string;
    }[];
}

export function ModernPageHeader({
    title,
    description,
    gradient = "from-primary-600 to-purple-600",
    icon,
    actions,
    stats
}: ModernPageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <div className="flex items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    {icon && (
                        <div className={`w-20 h-20 rounded-lg gradient-teal flex items-center justify-center text-white shadow-sm shrink-0`}>
                            {icon}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className={`text-4xl font-bold text-primary mb-1`}>
                            {title}
                        </h1>
                        {description && (
                            <p className="text-muted-foreground text-lg font-medium">{description}</p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                )}
            </div>

            {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl bg-gradient-to-br ${stat.color || gradient} shadow-lg`}
                        >
                            <div className="text-sm text-white/80 mb-1">{stat.label}</div>
                            <div className="text-2xl font-bold text-white">
                                {stat.value}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
