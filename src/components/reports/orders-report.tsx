"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Utensils, Clock, CheckCircle2, XCircle, TrendingUp,
    BarChart3, Users, DollarSign, Timer
} from "lucide-react";
import { useBranch } from "@/context/branch-context";

interface OrdersData {
    period: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    avgPrepTime: number;
    totalRevenue: number;
    avgTicket: number;
    ordersByHour: { hour: number; count: number }[];
    ordersByType: { type: string; count: number; revenue: number }[];
    tableEfficiency: { tableId: string; tableName: string; orders: number; revenue: number }[];
}

export function OrdersReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<OrdersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"week" | "month" | "year">("month");

    useEffect(() => {
        fetchData();
    }, [period, selectedBranch?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
            const res = await fetch(`/api/reports/orders?period=${period}${branchParam}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (error) {
            console.error("Error fetching orders report:", error);
        } finally {
            setLoading(false);
        }
    };

    const periodLabels = {
        week: "Esta Semana",
        month: "Este Mes",
        year: "Este Año"
    };

    const typeLabels: Record<string, string> = {
        DINE_IN: "En mesa",
        TAKE_AWAY: "Para llevar",
        DELIVERY: "Delivery"
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
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
                <Utensils className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">Sin datos de órdenes</h3>
                <p className="text-slate-500">No hay órdenes registradas en este período</p>
            </div>
        );
    }

    const maxOrdersHour = Math.max(...data.ordersByHour.map(h => h.count), 1);
    const completionRate = data.totalOrders > 0
        ? ((data.completedOrders / data.totalOrders) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-6">
            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-800">Reporte de Órdenes</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Utensils size={24} />
                        </div>
                        <span className="font-medium opacity-90">Total Órdenes</span>
                    </div>
                    <div className="text-3xl font-bold">{data.totalOrders}</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="font-medium opacity-90">Completadas</span>
                    </div>
                    <div className="text-3xl font-bold">{data.completedOrders}</div>
                    <div className="text-sm opacity-80 mt-1">{completionRate}% tasa de éxito</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Timer size={24} />
                        </div>
                        <span className="font-medium opacity-90">Tiempo Promedio</span>
                    </div>
                    <div className="text-3xl font-bold">{data.avgPrepTime} min</div>
                    <div className="text-sm opacity-80 mt-1">De preparación</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <span className="font-medium opacity-90">Ingresos</span>
                    </div>
                    <div className="text-3xl font-bold">${data.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm opacity-80 mt-1">Ticket prom: ${data.avgTicket.toFixed(2)}</div>
                </motion.div>
            </div>

            {/* Orders by Hour */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 border border-slate-100"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-red-500" />
                    Órdenes por Hora del Día
                </h3>
                <div className="h-48 flex items-end gap-1">
                    {data.ordersByHour.map((hour, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(hour.count / maxOrdersHour) * 100}%` }}
                                transition={{ delay: 0.02 * i, duration: 0.3 }}
                                className="w-full bg-gradient-to-t from-red-500 to-rose-400 rounded-t min-h-[2px]"
                                title={`${hour.count} órdenes`}
                            />
                            <span className="text-[10px] text-slate-400">
                                {hour.hour}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Orders by Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={20} className="text-red-500" />
                        Por Tipo de Orden
                    </h3>
                    <div className="space-y-4">
                        {data.ordersByType.map((type, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-700">
                                        {typeLabels[type.type] || type.type}
                                    </span>
                                    <span className="text-slate-500">
                                        {type.count} ({((type.count / data.totalOrders) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(type.count / data.totalOrders) * 100}%` }}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                        className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Table Efficiency */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl p-6 border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-red-500" />
                        Rendimiento por Mesa
                    </h3>
                    {data.tableEfficiency.length > 0 ? (
                        <div className="space-y-3">
                            {data.tableEfficiency.slice(0, 5).map((table, i) => (
                                <div key={table.tableId} className="flex items-center gap-4">
                                    <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800">{table.tableName}</div>
                                        <div className="text-sm text-slate-500">{table.orders} órdenes</div>
                                    </div>
                                    <div className="text-right font-bold text-emerald-600">
                                        ${table.revenue.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-8">Sin datos de mesas</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
