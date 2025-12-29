"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/context/branch-context";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

interface StudentRow {
    id: string;
    name: string;
    phone: string;
    course: string;
    schedule: string;
    months: {
        status: "NONE" | "PENDING" | "OVERDUE" | "PAID" | "PARTIAL";
        amount: number;
        paid: number;
    }[];
}

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export function StudentMatrixReport() {
    const { selectedBranch } = useBranch();
    const [data, setData] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        if (!selectedBranch?.businessId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/student-matrix?businessId=${selectedBranch.businessId}&year=${year}`);
            if (res.ok) {
                const jsonData = await res.json();
                setData(jsonData);
            }
        } catch (error) {
            console.error("Error fetching matrix:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedBranch?.businessId, year]);

    const handleExport = () => {
        // Create workbook matching "RELACION COLIMA 2019.xlsx" format
        const wb = XLSX.utils.book_new();

        // Headers
        const headers = ["TO", "NOMBRE (s)", "TEL", "Clase", "Horario", ...MONTHS];

        // Data rows
        const rows = data.map((student, index) => {
            const row: any[] = [
                index + 1, // TO (consecutive number)
                student.name,
                student.phone,
                student.course,
                student.schedule
            ];

            // Add month columns
            student.months.forEach(m => {
                if (m.status === "PAID") row.push(m.amount);
                else if (m.status === "PENDING") row.push("PEND");
                else if (m.status === "OVERDUE") row.push("VENC");
                else row.push("");
            });

            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 },  // TO
            { wch: 35 }, // Name
            { wch: 15 }, // Phone
            { wch: 20 }, // Class
            { wch: 25 }, // Schedule
            ...MONTHS.map(() => ({ wch: 8 })) // Months
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Relación Alumnos");
        XLSX.writeFile(wb, `Relacion_Alumnos_${year}.xlsx`);
    };

    const filteredData = data.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-800";
            case "OVERDUE": return "bg-red-100 text-red-800";
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-50 text-gray-400";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con título y controles */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Listado de Alumnos</h2>
                    <p className="text-slate-500">Relación de pagos y horarios anual</p>
                </div>
                <div className="flex gap-3 items-center">
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger
                            className="bg-white border-slate-200"
                            style={{ width: 'auto', minWidth: '80px', gap: '6px', paddingRight: '8px' }}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 font-semibold text-white hover:opacity-90 transition-all whitespace-nowrap"
                        style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#059669', border: 'none', fontSize: '14px' }}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Barra de filtros moderna */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
                        <Search className="h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar alumno o clase..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium">{filteredData.length}</span> alumnos encontrados
                    </div>
                </div>
            </div>

            {/* Tabla moderna estilo padres */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500">Cargando datos...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-slate-500 text-lg">No se encontraron alumnos</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">#</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Alumno</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Clase</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Horario</th>
                                    {MONTHS.map(m => (
                                        <th key={m} className="text-center px-3 py-4 text-sm font-semibold text-slate-600">{m}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((student, i) => (
                                    <tr
                                        key={student.id}
                                        className="border-b border-gray-100 transition-colors hover:bg-slate-50"
                                        style={{
                                            backgroundColor: i % 2 === 1 ? '#F8FAFC' : '#FFFFFF'
                                        }}
                                    >
                                        <td className="px-6 py-4 text-slate-500 text-sm">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                                    style={{ backgroundColor: getAvatarColor(i) }}
                                                >
                                                    {student.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-400">{student.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                                                {student.course || 'Sin curso'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-[150px]">
                                            {student.schedule || 'Sin horario'}
                                        </td>
                                        {student.months.map((m, idx) => (
                                            <td key={idx} className="text-center px-2 py-4">
                                                {m.status !== "NONE" && (
                                                    <span
                                                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                                                        style={getStatusStyles(m.status)}
                                                    >
                                                        {m.status === "PAID" ? `$${m.amount}` :
                                                            m.status === "OVERDUE" ? "VENC" : "PEND"}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Colores para avatares
function getAvatarColor(index: number): string {
    const colors = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#EA580C', '#0891B2', '#4F46E5', '#DB2777'];
    return colors[index % colors.length];
}

// Estilos para estados de pago
function getStatusStyles(status: string) {
    switch (status) {
        case "PAID": return { backgroundColor: '#D1FAE5', color: '#047857' };
        case "OVERDUE": return { backgroundColor: '#FEE2E2', color: '#DC2626' };
        case "PENDING": return { backgroundColor: '#FEF3C7', color: '#B45309' };
        default: return { backgroundColor: '#F1F5F9', color: '#64748B' };
    }
}

