"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Package, AlertTriangle, TrendingDown, ArrowRight,
    Box, DollarSign, RefreshCw, BarChart3
} from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface InventoryData {
    totalProducts: number;
    totalValue: number;
    lowStock: { id: string; name: string; quantity: number; minStock: number }[];
    noMovement: { id: string; name: string; lastSale: string | null }[];
    topMoving: { id: string; name: string; sold: number }[];
    categories: { name: string; count: number; value: number }[];
}

export function InventoryReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<InventoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedBranch?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : "";
            const res = await fetch(`/api/reports/inventory${branchParam}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Error fetching inventory report:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-slate-100 rounded-xl h-32 animate-pulse" />
                    ))}
                </div>
                <div className="bg-slate-100 rounded-xl h-64 animate-pulse" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos de inventario</h3>
                <p className="text-slate-500">No hay productos registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Reporte de Inventario</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Box size={24} />
                        </div>
                        <span className="font-medium opacity-90">Total Productos</span>
                    </div>
                    <div className="text-3xl font-bold">{data.totalProducts}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="font-medium opacity-90">Valor Total</span>
                    </div>
                    <div className="text-3xl font-bold">${data.totalValue.toLocaleString()}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="font-medium opacity-90">Stock Bajo</span>
                    </div>
                    <div className="text-3xl font-bold">{data.lowStock.length}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingDown size={24} />
                        </div>
                        <span className="font-medium opacity-90">Sin Movimiento</span>
                    </div>
                    <div className="text-3xl font-bold">{data.noMovement.length}</div>
                </motion.div>
            </div>

            {/* Low Stock Alert */}
            {data.lowStock.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} />
                        Productos con Stock Bajo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.lowStock.slice(0, 9).map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl p-4 border border-amber-100 flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium text-slate-800">{product.name}</div>
                                    <div className="text-sm text-slate-500">
                                        Mínimo: {product.minStock}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-amber-600">
                                    {product.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Top Moving Products */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <RefreshCw size={20} className="text-cyan-500" />
                    Mayor Rotación (últimos 30 días)
                </h3>
                {data.topMoving.length > 0 ? (
                    <div className="space-y-3">
                        {data.topMoving.slice(0, 5).map((product, i) => (
                            <div key={product.id} className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center bg-cyan-100 text-cyan-600 rounded-lg font-bold text-sm">
                                    {i + 1}
                                </span>
                                <div className="flex-1 font-medium text-slate-800">{product.name}</div>
                                <div className="text-right font-bold text-cyan-600">
                                    {product.sold} vendidos
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">Sin datos de rotación</p>
                )}
            </motion.div>

            {/* Categories */}
            {data.categories.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-cyan-500" />
                        Por Categoría
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.categories.map((cat, i) => (
                            <div
                                key={i}
                                className="bg-slate-50 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium text-slate-800">{cat.name || "Sin categoría"}</div>
                                    <div className="text-sm text-slate-500">{cat.count} productos</div>
                                </div>
                                <div className="text-lg font-bold text-slate-700">
                                    ${cat.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
