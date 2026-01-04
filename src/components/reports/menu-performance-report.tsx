"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Utensils, TrendingUp, TrendingDown, Star,
    DollarSign, BarChart3, PieChart
} from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface MenuData {
    period: string;
    topSelling: { id: string; name: string; quantity: number; revenue: number; category: string }[];
    lowPerformers: { id: string; name: string; quantity: number; revenue: number; category: string }[];
    revenueByCategory: { category: string; revenue: number; count: number }[];
    avgItemPrice: number;
    totalMenuItems: number;
}

export function MenuPerformanceReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<MenuData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"week" | "month" | "year">("month");

    useEffect(() => {
        fetchData();
    }, [period, selectedBranch?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
            const res = await fetch(`/api/reports/menu?period=${period}${branchParam}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Error fetching menu report:", error);
        } finally {
            setLoading(false);
        }
    };

    const periodLabels = {
        week: "Esta Semana",
        month: "Este Mes",
        year: "Este Año"
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-slate-100 rounded-xl h-32 animate-pulse" />
                    ))}
                </div>
                <div className="bg-slate-100 rounded-xl h-80 animate-pulse" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <Utensils className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos del menú</h3>
                <p className="text-slate-500">No hay ventas de productos en este período</p>
            </div>
        );
    }

    const totalCategoryRevenue = data.revenueByCategory.reduce((sum, c) => sum + c.revenue, 0);

    const categoryColors = [
        "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
        "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"
    ];

    return (
        <div className="space-y-6">
            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-800">Desempeño del Menú</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Utensils size={24} />
                        </div>
                        <span className="font-medium opacity-90">Total Platillos</span>
                    </div>
                    <div className="text-3xl font-bold">{data.totalMenuItems}</div>
                    <div className="text-sm opacity-80 mt-1">En el menú</div>
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
                        <span className="font-medium opacity-90">Precio Promedio</span>
                    </div>
                    <div className="text-3xl font-bold">${data.avgItemPrice.toFixed(2)}</div>
                    <div className="text-sm opacity-80 mt-1">Por platillo</div>
                </motion.div>
            </div>

            {/* Top Selling */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-500" />
                    Más Vendidos
                </h3>
                {data.topSelling.length > 0 ? (
                    <div className="space-y-3">
                        {data.topSelling.slice(0, 10).map((item, i) => (
                            <div key={item.id} className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-lg font-bold text-sm">
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    <div className="text-sm text-slate-500">{item.category || "Sin categoría"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800">{item.quantity} unid.</div>
                                    <div className="text-sm text-emerald-600">${item.revenue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">Sin ventas en este período</p>
                )}
            </motion.div>

            {/* Revenue by Category */}
            {data.revenueByCategory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChart size={20} className="text-amber-500" />
                        Ingresos por Categoría
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Visual bars */}
                        <div className="space-y-3">
                            {data.revenueByCategory.map((cat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700 flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                                            />
                                            {cat.category || "Sin categoría"}
                                        </span>
                                        <span className="text-slate-500">${cat.revenue.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(cat.revenue / totalCategoryRevenue) * 100}%` }}
                                            transition={{ delay: 0.3 + i * 0.1 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            {data.revenueByCategory.slice(0, 4).map((cat, i) => (
                                <div
                                    key={i}
                                    className="bg-slate-50 rounded-xl p-4 text-center"
                                >
                                    <div
                                        className="text-2xl font-bold"
                                        style={{ color: categoryColors[i % categoryColors.length] }}
                                    >
                                        {((cat.revenue / totalCategoryRevenue) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">{cat.category || "Sin cat."}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Low Performers */}
            {data.lowPerformers.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6"
                >
                    <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                        <TrendingDown size={20} />
                        Menos Vendidos (Considerar revisar)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.lowPerformers.slice(0, 6).map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl p-4 border border-red-100"
                            >
                                <div className="font-medium text-slate-800">{item.name}</div>
                                <div className="text-sm text-slate-500">{item.category || "Sin categoría"}</div>
                                <div className="mt-2 text-red-600 font-bold">{item.quantity} vendidos</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
