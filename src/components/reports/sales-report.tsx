"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ShoppingCart, TrendingUp, DollarSign, Package,
    Calendar, Download, BarChart3, ArrowUp, ArrowDown
} from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface SalesData {
    period: string;
    totalSales: number;
    salesCount: number;
    avgTicket: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
    salesByDay: { date: string; amount: number }[];
    comparison: { value: number; percentage: number };
}

export function SalesReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<SalesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"week" | "month" | "year">("month");

    useEffect(() => {
        fetchData();
    }, [period, selectedBranch?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
            const res = await fetch(`/api/reports/sales?period=${period}${branchParam}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Error fetching sales report:", error);
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
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
                <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos de ventas</h3>
                <p className="text-slate-500">No hay ventas registradas en este período</p>
            </div>
        );
    }

    const maxSaleDay = Math.max(...data.salesByDay.map(d => d.amount), 1);

    return (
        <div className="space-y-6">
            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-800">Reporte de Ventas</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="font-medium opacity-90">Ventas Totales</span>
                    </div>
                    <div className="text-3xl font-bold">${data.totalSales.toLocaleString()}</div>
                    {data.comparison && (
                        <div className="flex items-center gap-1 mt-2 text-sm">
                            {data.comparison.percentage >= 0 ? (
                                <ArrowUp size={16} />
                            ) : (
                                <ArrowDown size={16} />
                            )}
                            <span>{Math.abs(data.comparison.percentage).toFixed(1)}% vs período anterior</span>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="font-medium opacity-90">Transacciones</span>
                    </div>
                    <div className="text-3xl font-bold">{data.salesCount}</div>
                    <div className="text-sm opacity-80 mt-2">Ventas completadas</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <span className="font-medium opacity-90">Ticket Promedio</span>
                    </div>
                    <div className="text-3xl font-bold">${data.avgTicket.toFixed(2)}</div>
                    <div className="text-sm opacity-80 mt-2">Por transacción</div>
                </motion.div>
            </div>

            {/* Sales Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-orange-500" />
                    Ventas por Día
                </h3>
                <div className="h-64 flex items-end gap-2">
                    {data.salesByDay.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(day.amount / maxSaleDay) * 100}%` }}
                                transition={{ delay: 0.1 * i, duration: 0.5 }}
                                className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg min-h-[4px]"
                                title={`$${day.amount.toLocaleString()}`}
                            />
                            <span className="text-xs text-slate-500 font-medium">
                                {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-orange-500" />
                    Top 10 Productos
                </h3>
                {data.topProducts.length > 0 ? (
                    <div className="space-y-3">
                        {data.topProducts.slice(0, 10).map((product, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-lg font-bold text-sm">
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">{product.name}</div>
                                    <div className="text-sm text-slate-500">{product.quantity} unidades</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800">${product.revenue.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">Sin productos vendidos en este período</p>
                )}
            </motion.div>

            {/* Export Button */}
            <div className="flex justify-end">
                <button
                    className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                    <Download size={18} />
                    Exportar Reporte
                </button>
            </div>
        </div>
    );
}
