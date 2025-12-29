"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";

interface CustomChartData {
    [key: string]: string | number;
}

interface CustomChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (widget: any) => void;
}

export function CustomChartModal({ isOpen, onClose, onSave }: CustomChartModalProps) {
    const [title, setTitle] = useState("");
    const [chartType, setChartType] = useState<"area" | "bar" | "line" | "pie" | "radar">("bar");
    const [dataRows, setDataRows] = useState<CustomChartData[]>([
        { label: "", value: "" }
    ]);

    const addDataRow = () => {
        setDataRows([...dataRows, { label: "", value: "" }]);
    };

    const removeDataRow = (index: number) => {
        setDataRows(dataRows.filter((_, i) => i !== index));
    };

    const updateDataRow = (index: number, key: string, value: string) => {
        const newRows = [...dataRows];
        newRows[index][key] = key === "label" ? value : parseFloat(value) || 0;
        setDataRows(newRows);
    };

    const handleSave = () => {
        if (!title || dataRows.length === 0 || !dataRows[0].label) return;

        // Generar colores automáticamente
        const autoColors = [
            "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
            "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
        ];

        const widget = {
            id: `custom-${Date.now()}`,
            title,
            type: "chart" as const,
            chartType,
            visible: true,
            color: autoColors[0],
            data: dataRows.filter(row => row.label !== "").map((row, index) => ({
                ...row,
                color: autoColors[index % autoColors.length] // Color automático por fila
            }))
        };

        onSave(widget);

        // Reset form
        setTitle("");
        setChartType("bar");
        setDataRows([{ label: "", value: "" }]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Nueva Gráfica</h2>
                        <p className="text-sm text-muted-text mt-1">Los colores se asignan automáticamente</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Ventas por Mes"
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                    </div>

                    {/* Tipo de Gráfica */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Gráfica</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[
                                { value: "bar", label: "Barras", icon: "📊" },
                                { value: "line", label: "Línea", icon: "📈" },
                                { value: "area", label: "Área", icon: "📉" },
                                { value: "pie", label: "Pastel", icon: "🥧" },
                                { value: "radar", label: "Radar", icon: "🎯" }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setChartType(type.value as any)}
                                    className={`p-3 rounded-lg border-2 transition-all text-center ${chartType === type.value
                                            ? "border-primary-600 bg-primary-50"
                                            : "border-border hover:border-primary-300"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{type.icon}</div>
                                    <div className="text-xs font-medium">{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Datos */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Datos</label>
                            <button
                                onClick={addDataRow}
                                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Agregar
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {dataRows.map((row, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={row.label || ""}
                                            onChange={(e) => updateDataRow(index, "label", e.target.value)}
                                            placeholder="Etiqueta (Ej: Enero)"
                                            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        />
                                        <input
                                            type="number"
                                            value={row.value || ""}
                                            onChange={(e) => updateDataRow(index, "value", e.target.value)}
                                            placeholder="Valor (Ej: 1200)"
                                            className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                                        />
                                    </div>
                                    {dataRows.length > 1 && (
                                        <button
                                            onClick={() => removeDataRow(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title || dataRows.length === 0 || !dataRows[0].label}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Crear Gráfica
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
