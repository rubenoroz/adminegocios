"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Loader2, DollarSign, Calendar, Users } from "lucide-react";
import { ModernKpiCard } from "@/components/ui/modern-kpi-card";
import { useBranch } from "@/context/branch-context";
import { format, startOfMonth, endOfMonth } from "date-fns";
import * as XLSX from "xlsx";

interface PayrollRow {
    teacherId: string;
    name: string;
    hourlyRate: number;
    totalHours: number;
    totalClasses: number;
    totalPay: number;
    details: any[];
}

export function PayrollReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<PayrollRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const fetchData = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/payroll?businessId=${selectedBranch.businessId}&startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            }
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch?.businessId]); // Don't auto-fetch on date change, wait for button? Or auto? Let's wait for button or effect

    const handleExport = () => {
        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = data.map(row => ({
            "Maestro": row.name,
            "Horas Totales": row.totalHours,
            "Clases": row.totalClasses,
            "Tarifa/Hora": row.hourlyRate,
            "Total a Pagar": row.totalPay
        }));

        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Nómina");

        // Details Sheet
        const detailsData: any[] = [];
        data.forEach(teacher => {
            teacher.details.forEach(d => {
                detailsData.push({
                    "Maestro": teacher.name,
                    "Fecha": d.date,
                    "Clase": d.course,
                    "Horario": d.time,
                    "Duración (Hrs)": d.hours
                });
            });
        });

        const wsDetails = XLSX.utils.json_to_sheet(detailsData);
        XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Clases");

        XLSX.writeFile(wb, `Nomina_${startDate}_${endDate}.xlsx`);
    };

    const totalPayroll = data.reduce((acc, curr) => acc + curr.totalPay, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Nómina de Maestros</h2>
                <p className="text-slate-500">Cálculo basado en horas clase programadas</p>
            </div>

            {/* Controles de fecha */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Desde</span>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-50 border-0 w-[140px]"
                            style={{ padding: '6px 10px', height: 'auto' }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Hasta</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-50 border-0 w-[140px]"
                            style={{ padding: '6px 10px', height: 'auto' }}
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                        style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#2563EB', border: 'none', fontSize: '14px' }}
                    >
                        <Calendar className="h-4 w-4" />
                        Calcular
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0}
                        className="flex items-center gap-2 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 whitespace-nowrap"
                        style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#059669', border: 'none', fontSize: '14px' }}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <ModernKpiCard
                    title="Maestros Activos"
                    value={data.filter(d => d.totalHours > 0).length.toString()}
                    icon={Users}
                    gradientClass="gradient-employees"
                    subtitle="Con clases programadas"
                />
                <ModernKpiCard
                    title="Total Nómina"
                    value={`$${totalPayroll.toFixed(2)}`}
                    icon={DollarSign}
                    gradientClass="gradient-finance"
                    subtitle="Periodo seleccionado"
                />
            </div>

            {/* Tabla moderna */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Calculando nómina...</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">💼</div>
                        <p className="text-slate-500 text-lg">No hay datos para el periodo seleccionado</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Maestro</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Tarifa/Hr</th>
                                <th className="text-center px-6 py-4 text-sm font-semibold text-slate-600">Clases</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Horas Totales</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Total a Pagar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr
                                    key={row.teacherId}
                                    className="border-b border-gray-100 transition-colors hover:bg-slate-50"
                                    style={{
                                        backgroundColor: i % 2 === 1 ? '#F8FAFC' : '#FFFFFF'
                                    }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                                style={{ backgroundColor: getAvatarColor(i) }}
                                            >
                                                {row.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                            </div>
                                            <span className="font-semibold text-slate-900">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600">${row.hourlyRate.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                            {row.totalClasses}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600">{row.totalHours.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-emerald-600 text-lg">${row.totalPay.toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Colores para avatares
function getAvatarColor(index: number): string {
    const colors = ['#7C3AED', '#2563EB', '#059669', '#DC2626', '#EA580C', '#0891B2', '#4F46E5', '#DB2777'];
    return colors[index % colors.length];
}

