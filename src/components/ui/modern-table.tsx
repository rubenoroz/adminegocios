"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { MoreVertical } from "lucide-react";

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => ReactNode;
    sortable?: boolean;
    width?: string;
}

interface ModernTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    actions?: (item: T) => ReactNode;
    emptyMessage?: string;
    striped?: boolean;
}

export function ModernTable<T extends { id?: string | number }>({
    data,
    columns,
    onRowClick,
    actions,
    emptyMessage = "No hay datos disponibles",
    striped = true
}: ModernTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="modern-card p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-muted-text text-lg">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="modern-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-border bg-surface/50">
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-4 text-left text-sm font-semibold text-primary-900"
                                    style={{ width: column.width }}
                                >
                                    {column.label}
                                </th>
                            ))}
                            {actions && (
                                <th className="px-6 py-4 text-right text-sm font-semibold text-primary-900 w-20">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, rowIndex) => (
                            <motion.tr
                                key={item.id || rowIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: rowIndex * 0.05 }}
                                onClick={() => onRowClick?.(item)}
                                className={`
                                    border-b border-border transition-all
                                    ${onRowClick ? "cursor-pointer hover:bg-primary-50" : ""}
                                    ${striped && rowIndex % 2 === 1 ? "bg-surface/30" : ""}
                                    group
                                `}
                            >
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        {column.render
                                            ? column.render(item)
                                            : String(item[column.key as keyof T] || "-")}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {actions(item)}
                                        </div>
                                    </td>
                                )}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
